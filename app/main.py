from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base,engine
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.routers import users, auth, transactions, categories, dashboard, ai, admin, budgets, wallets



app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)

@app.get("/")
def home():
    return {"message": "Hello FastAPI"}
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(admin.router)
app.include_router(wallets.router)
app.include_router(budgets.router)
