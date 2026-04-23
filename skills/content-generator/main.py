import random
from typing import Dict, Any

def generate_xhs_content(topic: str) -> Dict[str, Any]:
    """
    生成小红书风格文案：包含 Emoji、标题、正文和话题标签
    """
    # 模拟文案生成
    title = f"🔥 绝绝子！【{topic}】最全避坑指南来啦！✨"
    
    body_parts = [
        f"真的一整个被惊艳到！去之前还很担心，结果完全超出预期好吗！！🌈",
        f"这绝对是我今年最满意的发现了，不允许任何一个姐妹不知道它！！🙌",
        f"细节做得超级到位，拍照也太出片了吧！谁拍谁好看系列！！📸"
    ]
    
    body = random.choice(body_parts) + "\n\n记得一定要早点去哦，不然人多到裂开！！🔥"
    
    hashtags = [f"#{topic}", "#小红书成长笔记", "#笔记灵感", "#生活碎片"]
    
    return {
        "title": title,
        "body": body,
        "hashtags": hashtags,
        "rendered_text": f"{title}\n\n{body}\n\n{' '.join(hashtags)}"
    }

if __name__ == "__main__":
    # 测试生成的文案
    result = generate_xhs_content("杭州周边游")
    print(f"TITLE: {result['title']}")
    print("-" * 20)
    print(result['rendered_text'])
