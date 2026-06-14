from abc import ABC, abstractmethod
from uuid import UUID
from typing import Generic, TypeVar

T = TypeVar("T")


class Repository(ABC, Generic[T]):
    @abstractmethod
    async def get(self, id: UUID) -> T | None: ...

    @abstractmethod
    async def list(self, school_id: UUID) -> list[T]: ...

    @abstractmethod
    async def save(self, entity: T) -> T: ...

    @abstractmethod
    async def delete(self, id: UUID) -> None: ...
