from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Scan
from core.ws_manager import manager
from core.auth import decode_access_token

router = APIRouter()


@router.websocket("/scans/{scan_id}")
async def scan_websocket(
    scan_id: int,
    websocket: WebSocket,
    token: str = Query(...),          # ws://host/ws/scans/1?token=<jwt>
    db: Session = Depends(get_db),
):
    # Authenticate via token query param (WebSocket can't send headers)
    user_id = decode_access_token(token)
    if user_id is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Verify this scan belongs to the user
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == user_id).first()
    if not scan:
        await websocket.close(code=4004, reason="Scan not found")
        return

    await manager.connect(scan_id, websocket)
    try:
        # Keep connection alive — client can send pings if needed
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(scan_id, websocket)