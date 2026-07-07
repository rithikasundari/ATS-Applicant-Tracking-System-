import mysql.connector
from mysql.connector import pooling

dbconfig = {
    "host": "localhost",
    "user": "root",
    "password": "rithika07",
    "database": "login_system"
}


connection_pool = pooling.MySQLConnectionPool(
    pool_name="ats_pool",
    pool_size=10,
    pool_reset_session=True,
    **dbconfig
)


def get_connection():
    

    return connection_pool.get_connection()


print("Database Connection Pool Created Successfully!")