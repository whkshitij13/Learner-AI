import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

let cachedCurriculum = null;

export function loadLegacyCurriculum() {
  if (cachedCurriculum) {
    return cachedCurriculum;
  }

  const source = fs.readFileSync(path.join(process.cwd(), "script.js"), "utf8");
  const boundary = source.indexOf("const state =");
  const serializableSource = source
    .slice(0, boundary)
    .replace("const DATA =", "globalThis.DATA =")
    .replace("const CURRICULUM_AUDIT =", "globalThis.CURRICULUM_AUDIT =");

  const sandbox = {};
  vm.runInNewContext(serializableSource, sandbox);

  cachedCurriculum = {
    curriculum: sandbox.DATA,
    curriculumAudit: sandbox.CURRICULUM_AUDIT
  };

  return cachedCurriculum;
}
