from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base,engine
from app.models.user import User
from app.routers import users, auth, transactions, categories, dashboard, ai
from app.routers.admin import router as admin_router

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
app.include_router(admin_router)
