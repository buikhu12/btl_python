
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.savings_goal import SavingsGoal
from app.models.savings_contribution import SavingsContribution

from app.routers import users, auth, transactions, categories, dashboard, ai, budgets, wallets

from app.routers.savings_goals import router as savings_goals_router
from app.routers.admin import router as admin_router
from app.routers import report


app = FastAPI()

Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Hello FastAPI"}


app.include_router(users.router)
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(report.router)
app.include_router(admin_router)
app.include_router(savings_goals_router)
app.include_router(budgets.router)
app.include_router(wallets.router)
