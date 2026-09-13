import json
from pathlib import Path

PATH = Path("config.json")

def load():
    if not PATH.exists():
        raise RuntimeError("config.json не найден.")
    cfg = json.loads(PATH.read_text(encoding="utf-8"))
    if cfg.get("token") in (None, "", "PUT_BOT_TOKEN_HERE"):
        raise RuntimeError("В config.json не указан token.")
    return cfg
