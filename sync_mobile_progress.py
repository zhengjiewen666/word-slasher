import json
import re

backup_path = r'c:\Users\郑杰文\Documents\xwechat_files\wxid_i2chcxf83h4h22_5f11\msg\file\2026-10\斩词客_词库备份_2026-10-26.json'
with open(backup_path, 'r', encoding='utf-8') as f:
    latest_deck = json.load(f)

slashed_count = sum(1 for w in latest_deck if w.get('slashed'))
print(f"Loaded backup: {len(latest_deck)} words, {slashed_count} slashed words.")

# 1. 更新 midterm_words.json
target_json_path = r'C:\Users\郑杰文\.gemini\antigravity\scratch\word-slasher\midterm_words.json'
with open(target_json_path, 'w', encoding='utf-8') as f:
    json.dump(latest_deck, f, ensure_ascii=False, indent=2)

# 2. 更新 index.html 中的 INITIAL_DECK
html_path = r'C:\Users\郑杰文\.gemini\antigravity\scratch\word-slasher\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 替换 INITIAL_DECK
target_start = 'const INITIAL_DECK = ['
target_end = '];'
start_idx = html.find(target_start)
end_idx = html.find(target_end, start_idx)

json_str = json.dumps(latest_deck, ensure_ascii=False, indent=2)
new_deck_code = f"const INITIAL_DECK = {json_str};"

html_updated = html[:start_idx] + new_deck_code + html[end_idx + len(target_end):]

# 并且升级 STORAGE_KEY 为带今天时间戳的版本，确保电脑浏览器打开时，立刻丢弃旧的0斩杀缓存，强制以手机这98个战果为最新基准！
storage_regex = r"const STORAGE_KEY = '[^']+';"
new_storage = "const STORAGE_KEY = 'word_slasher_deck_v3_synced';"
html_updated = re.sub(storage_regex, new_storage, html_updated)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_updated)

# 同步更新 Artifact
artifact_path = r'C:\Users\郑杰文\.gemini\antigravity\brain\c973b16f-1cad-49ff-ae4f-ae14845b04e9\word_slasher_app.html'
with open(artifact_path, 'w', encoding='utf-8') as f:
    f.write(html_updated)

print("Successfully updated index.html and midterm_words.json with latest mobile progress!")
