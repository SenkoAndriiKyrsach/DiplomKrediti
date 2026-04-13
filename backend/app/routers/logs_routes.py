from fastapi import APIRouter
from app.repositories.log_repo import get_logs

router = APIRouter()


@router.get("")
def list_logs(limit: int = 200, action_type: str = None):
    return {"logs": get_logs(limit=limit, action_type=action_type)}
