from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    type: Literal["income", "expense"]
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=20)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    type: Literal["income", "expense"] | None = None
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=20)


class CategoryResponse(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
