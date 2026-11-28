#!/usr/bin/env python3
"""扫描 tools/ 目录并合并配置文件，生成前端使用的工具清单。"""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = ROOT / "tools"
CONFIG = TOOLS_DIR / "sites.json"
OUTPUT = ROOT / "JS" / "tools-data.js"


def clean(value):
    return html.unescape(re.sub(r"<[^>]+>", "", str(value))).strip()


def extract_title(text, path):
    match = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
    title = clean(match.group(1)) if match else path.stem
    title = re.sub(r"\s*[·|]\s*(个人主页|Tools?|Home).*$", "", title, flags=re.I)
    return title[:60] or path.stem


def extract_desc(text):
    match = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
        text,
        re.I | re.S,
    )
    if not match:
        match = re.search(r'<p\s+class=["\']sub["\'][^>]*>(.*?)</p>', text, re.I | re.S)
    return clean(match.group(1))[:120] if match else ""


def is_redirect(text):
    return bool(
        re.search(r'http-equiv=["\']refresh["\']', text, re.I)
        or re.search(r"location\.replace\s*\(", text, re.I)
    )


def local_tools():
    items = []
    for path in sorted(TOOLS_DIR.glob("*.html")):
        if path.name.startswith("_"):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if is_redirect(text):
            continue
        items.append(
            {
                "name": extract_title(text, path),
                "url": f"tools/{path.name}",
                "desc": extract_desc(text),
                "icon": "",
            }
        )
    return items


def configured_sites():
    if not CONFIG.exists():
        return []
    data = json.loads(CONFIG.read_text(encoding="utf-8"))
    sites = data.get("sites", []) if isinstance(data, dict) else data
    result = []
    for site in sites:
        if not isinstance(site, dict):
            continue
        name = clean(site.get("name", ""))
        url = clean(site.get("url", ""))
        if not name or not url:
            continue
        if not url.startswith(("http://", "https://", "/")):
            url = f"tools/{url}"
        result.append(
            {
                "name": name,
                "url": url,
                "desc": clean(site.get("desc", "")),
                "icon": clean(site.get("icon", "")),
            }
        )
    return result


def main():
    items = local_tools()
    seen = {item["url"] for item in items}
    for item in configured_sites():
        if item["url"] in seen:
            continue
        seen.add(item["url"])
        items.append(item)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        "window.TOOLS_DATA = "
        + json.dumps(items, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    print(f"生成 {OUTPUT.relative_to(ROOT)}：{len(items)} 项")
    for item in items:
        print(f"  - {item['name']} -> {item['url']}")


if __name__ == "__main__":
    main()
