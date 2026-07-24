import fs from "node:fs/promises";

const tools = JSON.parse(await fs.readFile("data/tools.json", "utf8"));
const today = new Date();
const DAYS = 86_400_000;
const rules = [
  { label: "연령·요금·약관", days: 90 },
  { label: "기능·언어·S2B", days: 180 },
];

let due = 0;
for (const rule of rules) {
  const cutoff = new Date(today.getTime() - rule.days * DAYS);
  const items = tools.filter((tool) => new Date(`${tool.verified_at}T00:00:00`) < cutoff);
  due += items.length;
  console.log(`${rule.label} 재검증 대상 (${rule.days}일): ${items.length}개`);
  if (items.length) console.log(items.map((tool) => `- ${tool.name} (${tool.verified_at})`).join("\n"));
}

if (!due) console.log("현재 재검증 기한이 지난 공개 도구가 없습니다.");
