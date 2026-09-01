from typing import Dict, List
from fastapi import WebSocket

class FacilityConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, facility_id: str):
        await websocket.accept()
        if facility_id not in self.active_connections:
            self.active_connections[facility_id] = []
        self.active_connections[facility_id].append(websocket)

    def disconnect(self, websocket: WebSocket, facility_id: str):
        if facility_id in self.active_connections:
            self.active_connections[facility_id].remove(websocket)

    async def broadcast_to_facility(self, message: str, facility_id: str):
        if facility_id in self.active_connections:
            for connection in self.active_connections[facility_id]:
                await connection.send_text(message)

manager = FacilityConnectionManager()
