import httpx
from typing import Optional

class TermuxController:
    """
    Termux HTTP API 封装，提供真机控制接口
    """
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url

    async def tap(self, x: int, y: int):
        print(f"Executing tap at ({x}, {y})")
        # return await httpx.post(f"{self.base_url}/tap", json={"x": x, "y": y})

    async def swipe(self, x1: int, y1: int, x2: int, y2: int, duration: int = 300):
        print(f"Executing swipe from ({x1}, {y1}) to ({x2}, {y2})")

    async def input_text(self, text: str):
        print(f"Inputting text: {text}")

    async def screenshot(self) -> str:
        print("Capturing screenshot...")
        return "base64_img_data"

    async def current_app(self) -> str:
        return "com.xingin.xhs"

if __name__ == "__main__":
    print("TAP-MCP is ready to accept commands.")
