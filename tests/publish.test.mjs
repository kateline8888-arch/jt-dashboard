import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const embeddedRecords = JSON.parse(html.match(/const DATA=(.*);\r?\nconst PAGE_SIZE/s)[1]);

test("published dashboard is complete and self-contained", () => {
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /品类/);
  assert.match(html, /SKU/);
  assert.match(html, /运营/);
  assert.match(html, /上标状态/);
  assert.match(html, /失败原因/);
  assert.match(html, /"status":"成功"/);
  assert.match(html, /"status":"失败"/);
  assert.match(html, /"status":"待处理"/);
  assert.doesNotMatch(html, /"primaryCategory":"未匹配"/);
  assert.doesNotMatch(html, /"primaryOperator":"未匹配"/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+href=/i);
});

test("published dashboard contains all 450 ASIN records", () => {
  assert.equal((html.match(/"asin":/g) ?? []).length, 450);
  assert.match(html, /数据更新：2026-09-15/);
});

test("published dashboard exposes the no-action status across data and UI", () => {
  const statusCounts = embeddedRecords.reduce((counts, row) => {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  }, {});

  assert.deepEqual(statusCounts, {
    成功: 384,
    失败: 25,
    待处理: 32,
    无需处理: 9,
  });
  assert.match(html, /上标状态[^\n]*无需处理/);
  assert.match(html, /status-no-action/);
});

test("no-action details retain the exact business reason and do not request follow-up", () => {
  const allowedReasons = new Set(["非JT品牌", "非JT品牌且已停售", "已停售"]);
  const noActionRecords = embeddedRecords.filter((row) => row.status === "无需处理");

  assert.equal(noActionRecords.length, 9);
  assert.ok(noActionRecords.every((row) => allowedReasons.has(row.rawReason)));
  assert.match(html, /r\.status==='无需处理'\?'无需处理':'待跟进'/);
});

test("repository includes an admin-only local update path without publishing Excel", async () => {
  const guide = await fs.readFile(new URL("../ADMIN_UPDATE.md", import.meta.url), "utf8");
  const updater = await fs.readFile(new URL("../admin/update-dashboard.cmd", import.meta.url), "utf8");
  assert.match(guide, /不要把 Excel 上传到 GitHub/);
  assert.match(guide, /Write.*Maintain.*Admin/);
  assert.match(updater, /generated\\index\.html/);
  assert.match(updater, /Do not upload the source workbook/);
});
