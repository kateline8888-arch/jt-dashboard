import test from "node:test";
import assert from "node:assert/strict";
import { deriveStatus } from "../admin/data-model.mjs";

const noActionReasons = ["非JT品牌", "非JT品牌且已停售", "已停售"];

test("classifies exact no-action reasons when the record is not successful", () => {
  for (const unlistedReason of noActionReasons) {
    assert.equal(
      deriveStatus({ oldStatus: "否", latestStatus: "", hasRejection: false, unlistedReason }),
      "无需处理",
    );
  }
});

test("keeps currently successful records successful", () => {
  assert.equal(
    deriveStatus({ oldStatus: "是", latestStatus: "", hasRejection: false, unlistedReason: "已停售" }),
    "成功",
  );
  assert.equal(
    deriveStatus({ oldStatus: "否", latestStatus: "是", hasRejection: false, unlistedReason: "非JT品牌" }),
    "成功",
  );
});

test("does not use fuzzy matching for no-action reasons", () => {
  assert.equal(
    deriveStatus({ oldStatus: "否", latestStatus: "", hasRejection: false, unlistedReason: "已停售商品" }),
    "待处理",
  );
  assert.equal(
    deriveStatus({ oldStatus: "否", latestStatus: "", hasRejection: true, unlistedReason: "品牌资料不完整" }),
    "失败",
  );
});
