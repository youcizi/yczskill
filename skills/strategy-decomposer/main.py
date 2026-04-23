from typing import Dict, Any

def decompose_strategy(prompt: str) -> Dict[str, Any]:
    """
    策略拆解逻辑
    """
    return {
        "audience": ["都市白领", "精致妈妈"],
        "content_angle": ["高性价比", "情绪价值"],
        "publish_plan": {
            "platform": "xiaohongshu",
            "timing": "20:00-22:00"
        },
        "kpi": {
            "engagement_rate": "5%",
            "cpc": "< 1.5"
        }
    }

if __name__ == "__main__":
    print(decompose_strategy("推广一款无糖气泡水"))
