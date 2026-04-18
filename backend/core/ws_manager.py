"""
Manages WebSocket connections grouped by scan_id.
The pipeline imports this to broadcast live updates to connected clients.
"""
import json
from collections import defaultdict
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # scan_id -> list of active WebSocket connections
        self._connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, scan_id: int, websocket: WebSocket):
        await websocket.accept()
        self._connections[scan_id].append(websocket)

    def disconnect(self, scan_id: int, websocket: WebSocket):
        self._connections[scan_id].remove(websocket)
        if not self._connections[scan_id]:
            del self._connections[scan_id]

    async def broadcast(self, scan_id: int, data: dict):
        """Send a JSON message to all clients watching this scan."""
        dead = []
        for ws in self._connections.get(scan_id, []):
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        # Clean up disconnected clients
        for ws in dead:
            self._connections[scan_id].remove(ws)


# Singleton — imported by both the pipeline and the WebSocket route
manager = ConnectionManager()