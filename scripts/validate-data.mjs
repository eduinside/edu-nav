import fs from "node:fs/promises";

const readJson = async (path) => JSON.parse(await fs.readFile(path, "utf8"));
const [tools, taxonomy, enrichment, sources, researchQueue, baselineIds] = await Promise.all([
  readJson("data/tools.json"),
  readJson("data/taxonomy.json"),
  readJson("data/tool-enrichment.json"),
  readJson("data/sources.json"),
  readJson("data/research-queue.json"),
  readJson("data/baseline-tool-ids.json"),
]);

const errors = [];
const ids = new Set();
const sourceIds = new Set(sources.map((source) => source.id));
const enrichmentById = new Map(enrichment.map((item) => [item.id, item]));
const required = ["id", "name", "category", "one_liner", "grades", "pricing", "url", "verified_at"];
const enumFields = { category: taxonomy.categories, pricing: taxonomy.pricing, age_limit: taxonomy.age_limit, form: taxonomy.forms, user: taxonomy.user };

for (const tool of tools) {
  for (const key of required) if (tool[key] == null || tool[key] === "") errors.push(`${tool.id || "(no id)"}: 필수 필드 ${key} 누락`);
  if (ids.has(tool.id)) errors.push(`${tool.id}: 중복 ID`);
  ids.add(tool.id);
  if (!/^https:\/\//.test(tool.url || "")) errors.push(`${tool.id}: HTTPS URL 필요`);
  for (const [key, values] of Object.entries(enumFields)) if (tool[key] != null && !values.includes(tool[key])) errors.push(`${tool.id}: ${key} 값이 taxonomy에 없음`);
  for (const grade of tool.grades || []) if (!taxonomy.grades.includes(grade)) errors.push(`${tool.id}: grades 값이 taxonomy에 없음 (${grade})`);
  for (const subject of tool.subjects || []) if (!taxonomy.subjects.includes(subject)) errors.push(`${tool.id}: subjects 값이 taxonomy에 없음 (${subject})`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tool.verified_at || "")) errors.push(`${tool.id}: verified_at은 YYYY-MM-DD 형식이어야 함`);
  if (tool.age_limit == null && enrichmentById.get(tool.id)?.review?.status !== "조건부 공개") errors.push(`${tool.id}: 연령 미확인은 조건부 공개 상태와 함께 기록 필요`);
}

for (const item of enrichment) {
  if (!ids.has(item.id)) errors.push(`${item.id}: tools.json에 없는 보강 ID`);
  if (!(item.source_ids || []).length) errors.push(`${item.id}: 심층 보강에는 최소 한 건의 출처 필요`);
  for (const sourceId of item.source_ids || []) if (!sourceIds.has(sourceId)) errors.push(`${item.id}: 존재하지 않는 출처 ID ${sourceId}`);
  for (const stage of item.lesson_stages || []) if (!taxonomy.lesson_stages.includes(stage)) errors.push(`${item.id}: lesson_stages 값이 taxonomy에 없음 (${stage})`);
  if (item.review && !["추천", "조건부 활용", "참고"].includes(item.review.readiness)) errors.push(`${item.id}: 알 수 없는 학교 적용 판단`);
  if (item.review?.readiness === "추천" && (!item.safety?.summary || !item.adoption?.student_account)) errors.push(`${item.id}: 추천 판정에 안전·학생 계정 정보 필요`);
}

const seenSourceIds = new Set();
for (const source of sources) {
  if (!source.id || !source.url || !/^https:\/\//.test(source.url)) errors.push(`출처 ${source.id || "(no id)"}: ID 또는 HTTPS URL 누락`);
  if (seenSourceIds.has(source.id)) errors.push(`출처 ${source.id}: 중복 ID`);
  seenSourceIds.add(source.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source.checked_at || "")) errors.push(`출처 ${source.id}: checked_at은 YYYY-MM-DD 형식이어야 함`);
}

const queueIds = new Set();
for (const item of researchQueue) {
  if (!item.id || !item.name || !item.status || !item.evidence_level) errors.push(`조사 대기열 ${item.id || "(no id)"}: 필수 필드 누락`);
  if (ids.has(item.id)) errors.push(`조사 대기열 ${item.id}: 공개 도구와 ID 중복`);
  if (queueIds.has(item.id)) errors.push(`조사 대기열 ${item.id}: 중복 ID`);
  queueIds.add(item.id);
  for (const sourceId of item.source_ids || []) if (!sourceIds.has(sourceId)) errors.push(`조사 대기열 ${item.id}: 존재하지 않는 출처 ID ${sourceId}`);
}

for (const id of baselineIds) if (!ids.has(id)) errors.push(`기존 기준 도구 ID 누락: ${id}`);

if (errors.length) {
  console.error(`데이터 검증 실패 (${errors.length}건)`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`데이터 검증 통과: 공개 도구 ${tools.length}개, 심층 보강 ${enrichment.length}개, 출처 ${sources.length}건, 조사 대기열 ${researchQueue.length}개`);
