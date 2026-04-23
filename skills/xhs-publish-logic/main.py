import json
import os

def load_coords():
    base_path = os.path.dirname(__file__)
    with open(os.path.join(base_path, "xiaohongshu_coords.json"), "r", encoding="utf-8") as f:
        return json.load(f)

def run_publish_flow(content: str, title: str):
    """
    发布流程逻辑：根据坐标库执行点击序列
    """
    coords = load_coords()
    nodes = coords["nodes"]
    
    print(f"1. Clicking '+' button at {nodes['add_button']}")
    print(f"2. Selecting album at {nodes['album_select']}")
    print(f"3. Entering Title: {title} at {nodes['edit_title']}")
    print(f"4. Entering Content: {content} at {nodes['edit_content']}")
    print(f"5. Finalizing publish at {nodes['publish_button']}")
    
    return {"status": "execution_queued", "steps": 5}

if __name__ == "__main__":
    run_publish_flow("测试文案", "测试标题")
