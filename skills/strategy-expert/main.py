import json
from typing import List, Dict, Any

def analyze_plan(user_requirement: str) -> List[Dict[str, Any]]:
    """
    策略分析师：将用户需求拆解为任务流 JSON 数组
    
    @param user_requirement: 用户原始需求
    @returns: 包含任务节点的 JSON 数组
    """
    # 核心任务流拆解逻辑
    # 每个节点代表一个原子动作
    tasks = [
        {
            "id": "gen_01",
            "module": "content-generator",
            "action": "generate_xhs",
            "input": {
                "topic": user_requirement
            }
        },
        {
            "id": "post_01",
            "module": "uiautomator2",
            "action": "physical_touch_publish",
            "input": {
                "package": "com.xingin.xhs"
            }
        }
    ]
    
    return tasks

if __name__ == "__main__":
    # 模拟环境测试
    test_input = "如何做一份完美的夏日便当"
    plan = analyze_plan(test_input)
    print(json.dumps(plan, ensure_ascii=False, indent=2))
