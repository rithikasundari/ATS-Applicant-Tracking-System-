from dotenv import load_dotenv
import os
import smtplib
from email.mime.text import MIMEText
from database import get_connection
from fastapi import FastAPI, logger
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
import requests
import random

from pathlib import Path
import logging


logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
from fastapi import HTTPException
from jose import jwt
from fastapi import UploadFile, File, Form, HTTPException
import os
import pdfplumber
from PIL import Image
import pytesseract
from pydantic import BaseModel
from typing import Optional
from fastapi.responses import FileResponse



env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

EMAIL = os.getenv("EMAIL")
APP_PASSWORD = os.getenv("APP_PASSWORD")
AUTH_KEY = os.getenv("AUTH_KEY")
TEMPLATE_ID = os.getenv("TEMPLATE_ID")

SECRET_KEY = "ats_secret_key_2025"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_FILE_SIZE_MB = 2
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

DEFAULT_ACCEPT_SCORE = 80

app = FastAPI()

@app.on_event("startup")
def ensure_schema():
    
    try:
        conn = get_connection()
        cursor = conn.cursor(buffered=True)
        try:
            cursor.execute("""
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name   = 'rules'
                  AND column_name  = 'role_name'
            """)
            if cursor.fetchone()[0] == 0:
                cursor.execute("ALTER TABLE rules ADD COLUMN role_name VARCHAR(100) DEFAULT NULL")
                conn.commit()
                logging.info("Migration: added role_name column to rules table")
            else:
                logging.info("Schema OK: rules.role_name already exists")
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logging.error(f"Schema migration error: {e}")

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def generate_otp():
    return str(random.randint(100000, 999999))

def create_access_token(data):
    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return token


def send_email_otp(email, otp):
    msg = MIMEText(f"Your ATS Login OTP is: {otp}")
    msg["Subject"] = "ATS Login OTP"
    msg["From"] = EMAIL
    msg["To"] = email
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL, APP_PASSWORD)
        server.send_message(msg)

def extract_pdf_text(file_path):
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_image_text(file_path):
    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )
    image = Image.open(file_path)
    text = pytesseract.image_to_string(image)
    return text


def extract_resume_text(file_path):
    extension = os.path.splitext(file_path)[1].lower()
    if extension == ".pdf":
        return extract_pdf_text(file_path)
    elif extension in [".jpg", ".jpeg", ".png"]:
        return extract_image_text(file_path)
    return ""


def fetch_scoring_rules(cursor, role_name: str):
    
    cursor.execute(
        "SELECT skill_name, score FROM rules WHERE role_name = %s",
        (role_name,)
    )
    return cursor.fetchall()


def fetch_role_threshold(cursor, job_role: str) -> int:
    cursor.execute(
        "SELECT accept_score FROM role_thresholds WHERE role_name = %s",
        (job_role,)
    )
    row = cursor.fetchone()
    return row[0] if row else DEFAULT_ACCEPT_SCORE


def extract_skills_and_score(text, rules):
    text = text.lower()
    found_skills = []
    total_score = 0
    for skill_name, skill_score in rules:
        if skill_name.lower() in text:
            found_skills.append(skill_name)
            total_score += skill_score
    if total_score > 100:
        total_score = 100
    return found_skills, total_score


def get_status(score, threshold):
    if score >= threshold:
        return "Accepted"
    return "Rejected"


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Login(BaseModel):
    username: str
    password: str

class Register(BaseModel):
    username: str
    password: str
    email: str
    mobile: str

class Mobile(BaseModel):
    mobile: str

class OTPVerify(BaseModel):
    username: str
    otp: str

class Rule(BaseModel):
    skill_name: str
    score: int
    role_name: Optional[str] = None

class RoleThreshold(BaseModel):
    role_name: str
    accept_score: int


@app.post("/register")
def register(user: Register):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        hashed_password = hash_password(user.password)
        cursor.execute(
            """
            INSERT INTO users(username, password, email, mobile, role)
            VALUES(%s, %s, %s, %s, %s)
            """,
            (user.username, hashed_password, user.email, user.mobile, "USER")
        )
        conn.commit()
        logging.info(f"User Registered: {user.username}")
        return {"message": "User Registered Successfully"}
    except Exception as e:
        logging.error(f"Register Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/login")
def login(user: Login):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute(
            "SELECT * FROM users WHERE username=%s",
            (user.username,)
        )
        result = cursor.fetchone()
        if not result:
            return {"message": "Invalid Username or Password"}

        stored_password = result[2]
        check = verify_password(user.password, stored_password)

        if check:
            otp = generate_otp()
            cursor.execute(
                "INSERT INTO otp_verification(username, otp) VALUES(%s,%s)",
                (user.username, otp)
            )
            conn.commit()
            email = result[3]
            send_email_otp(email, otp)
            logging.info(f"OTP Sent To: {user.username}")
            return {"message": "OTP Sent", "username": user.username}

        return {"message": "Invalid Username or Password"}
    except Exception as e:
        logging.error(f"Login Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/verify-otp")
def verify_otp(data: OTPVerify):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute(
            """
            SELECT otp FROM otp_verification
            WHERE username=%s ORDER BY id DESC LIMIT 1
            """,
            (data.username,)
        )
        row = cursor.fetchone()
        if not row or row[0] != data.otp:
            return {"message": "Invalid OTP"}
        cursor.execute("SELECT role FROM users WHERE username=%s", (data.username,))
        user = cursor.fetchone()
        token = create_access_token({"sub": data.username, "role": user[0]})
        return {"message": "Login Successful", "token": token, "role": user[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/debug-env")
def debug_env():
    return {
        "email": EMAIL,
        "app_password_loaded": APP_PASSWORD is not None,
        "email_loaded": EMAIL is not None
    } 

@app.get("/")
def home():
    return {"message": "FastAPI Working"}


@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    job_role: str = Form(...),
):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)

    try:
        allowed_extensions = [".pdf", ".jpg", ".jpeg", ".png"]
        extension = os.path.splitext(file.filename)[1].lower()

        if extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail="Only PDF, JPG, JPEG and PNG files are allowed"
            )

        file_bytes = await file.read()

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
            )

        os.makedirs("uploads", exist_ok=True)

        file_path = os.path.join("uploads", file.filename)

        with open(file_path, "wb") as buffer:
            buffer.write(file_bytes)

        print("File saved:", file_path)

        resume_text = extract_resume_text(file_path)

        print("Resume text extracted successfully")

        rules = fetch_scoring_rules(cursor, job_role)

        skills, score = extract_skills_and_score(resume_text, rules)

        threshold = fetch_role_threshold(cursor, job_role)

        status = get_status(score, threshold)

        cursor.execute(
            """
            INSERT INTO resumes
            (username, filename, skills, score, status, job_role)
            VALUES (%s,%s,%s,%s,%s,%s)
            """,
            (
                "rithika",
                file.filename,
                ",".join(skills),
                score,
                status,
                job_role
            )
        )
        conn.commit()

        resume_id = cursor.lastrowid

        return {
            "message":    "Resume Uploaded Successfully",
            "resume_id":  resume_id,
            "filename":   file.filename,
            "job_role":   job_role,
            "threshold":  threshold,
            "skills":     skills,
            "score":      score,
            "status":     status
        }

    except Exception as e:
        print("====================================")
        print("UPLOAD ERROR:")
        print(str(e))
        print("====================================")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()


@app.get("/resume/{resume_id}")
def get_resume_by_id(resume_id: int):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute(
            """
            SELECT id, username, filename, skills, score, status, job_role
            FROM resumes WHERE id=%s
            """,
            (resume_id,)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=404,
                detail=f"No resume found with ID {resume_id}"
            )
        return {
            "resume_id": row[0],
            "username":  row[1],
            "filename":  row[2],
            "skills":    row[3].split(",") if row[3] else [],
            "score":     row[4],
            "status":    row[5],
            "job_role":  row[6],
        }
    finally:
        cursor.close()
        conn.close()


@app.get("/all-resumes")
def all_resumes():
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute(
            """
            SELECT id, username, filename, score, status, job_role
            FROM resumes
            ORDER BY id DESC
            """
        )
        rows = cursor.fetchall()
        return {
            "resumes": [
                {
                    "resume_id": r[0],
                    "username":  r[1],
                    "filename":  r[2],
                    "score":     r[3],
                    "status":    r[4],
                    "job_role":  r[5],
                }
                for r in rows
            ]
        }
    finally:
        cursor.close()
        conn.close()


@app.get("/rules")
def get_rules(role_name: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        if role_name:
            cursor.execute(
                "SELECT id, skill_name, score FROM rules WHERE role_name = %s ORDER BY skill_name",
                (role_name,)
            )
        else:
            cursor.execute("SELECT id, skill_name, score FROM rules ORDER BY skill_name")
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

@app.post("/add-rule")
def add_rule(rule: Rule):
    logging.info(f"POST /add-rule  skill={rule.skill_name!r}  score={rule.score}  role={rule.role_name!r}")
    if rule.score < 1:
        raise HTTPException(status_code=400, detail="Weightage cannot be negative or zero")

    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        if rule.role_name:
            cursor.execute(
                "SELECT id FROM rules WHERE skill_name = %s AND role_name = %s",
                (rule.skill_name, rule.role_name)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail=f"Skill '{rule.skill_name}' already exists for role '{rule.role_name}'"
                )
            cursor.execute(
                "SELECT COALESCE(SUM(score), 0) FROM rules WHERE role_name = %s",
                (rule.role_name,)
            )
            current_total = int(cursor.fetchone()[0])
            logging.info(f"  current_total={current_total}  adding={rule.score}")
            if current_total + rule.score > 100:
                raise HTTPException(
                    status_code=400,
                    detail=f"Total skill weightage cannot exceed 100. Current total for '{rule.role_name}': {current_total}, trying to add: {rule.score}"
                )
            cursor.execute(
                "INSERT INTO rules (skill_name, score, role_name) VALUES (%s, %s, %s)",
                (rule.skill_name, rule.score, rule.role_name)
            )
        else:
            cursor.execute(
                "INSERT INTO rules (skill_name, score) VALUES (%s, %s)",
                (rule.skill_name, rule.score)
            )
        conn.commit()
        new_id = cursor.lastrowid
        logging.info(f"Skill added successfully  id={new_id}")
        return {"message": "Skill added successfully", "id": new_id}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error adding rule: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/delete-rule/{rule_id}")
def delete_rule(rule_id: int):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("DELETE FROM rules WHERE id=%s", (rule_id,))
        conn.commit()
        return {"message": "Rule Deleted"}
    finally:
        cursor.close()
        conn.close()

@app.put("/update-rule/{rule_id}")
def update_rule(rule_id: int, rule: Rule):
    logging.info(f"PUT /update-rule/{rule_id}  skill={rule.skill_name!r}  score={rule.score}  role={rule.role_name!r}")
    if rule.score < 1:
        raise HTTPException(status_code=400, detail="Weightage cannot be negative or zero")
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        if rule.role_name:
            cursor.execute(
                "SELECT COALESCE(SUM(score), 0) FROM rules WHERE role_name = %s AND id != %s",
                (rule.role_name, rule_id)
            )
            other_total = int(cursor.fetchone()[0])
            if other_total + rule.score > 100:
                raise HTTPException(
                    status_code=400,
                    detail=f"Total skill weightage cannot exceed 100. Other skills sum to {other_total}, updating to: {rule.score}"
                )
        cursor.execute(
            "UPDATE rules SET skill_name=%s, score=%s WHERE id=%s",
            (rule.skill_name, rule.score, rule_id)
        )
        conn.commit()
        logging.info(f"Skill updated  id={rule_id}")
        return {"message": "Skill updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@app.get("/role-thresholds")
def get_role_thresholds():
    
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("SELECT id, role_name, accept_score FROM role_thresholds ORDER BY role_name")
        rows = cursor.fetchall()
        return [
            {"id": r[0], "role_name": r[1], "accept_score": r[2]}
            for r in rows
        ]
    finally:
        cursor.close()
        conn.close()

@app.post("/add-role-threshold")
def add_role_threshold(rt: RoleThreshold):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute(
            "INSERT INTO role_thresholds(role_name, accept_score) VALUES(%s,%s)",
            (rt.role_name, rt.accept_score)
        )
        conn.commit()
        return {"message": "Role threshold added"}
    finally:
        cursor.close()
        conn.close()

@app.put("/update-role-threshold/{rt_id}")
def update_role_threshold(rt_id: int, rt: RoleThreshold):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute(
            "UPDATE role_thresholds SET role_name=%s, accept_score=%s WHERE id=%s",
            (rt.role_name, rt.accept_score, rt_id)
        )
        conn.commit()
        return {"message": "Role threshold updated"}
    finally:
        cursor.close()
        conn.close()

@app.delete("/delete-role-threshold/{rt_id}")
def delete_role_threshold(rt_id: int):
    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("DELETE FROM role_thresholds WHERE id=%s", (rt_id,))
        conn.commit()
        return {"message": "Role threshold deleted"}
    finally:
        cursor.close()
        conn.close()

@app.get("/download-resume/{filename}")
def download_resume(filename: str):

    file_path = os.path.join("uploads", filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Resume file not found"
        )

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )