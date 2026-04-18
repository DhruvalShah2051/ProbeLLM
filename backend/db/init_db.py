from db.database import engine, Base
from db.models import User, Scan, AttackResult, AuditLog  # all four

def init():
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init()