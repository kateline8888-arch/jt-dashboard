export function cleanText(value) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text === "#NAME?" ? "" : text;
}

export function uniqueText(values, fallback = "\u672a\u5339\u914d") {
  const result = [...new Set((values ?? []).map(cleanText).filter(Boolean))];
  return result.length ? result : [fallback];
}

export const NO_ACTION_REASONS = new Set(["非JT品牌", "非JT品牌且已停售", "已停售"]);

export function isNoActionReason(value) {
  return NO_ACTION_REASONS.has(cleanText(value));
}

export function deriveStatus({ oldStatus, latestStatus, hasRejection, unlistedReason }) {
  const latest = cleanText(latestStatus);
  const old = cleanText(oldStatus);
  if (latest === "\u662f") return "\u6210\u529f";
  if (latest !== "\u5426" && old === "\u662f") return "\u6210\u529f";
  if (isNoActionReason(unlistedReason)) return "无需处理";
  if (latest === "\u5426") return "\u5931\u8d25";
  if (hasRejection) return "\u5931\u8d25";
  return "\u5f85\u5904\u7406";
}

export function classifyFailure(value) {
  const text = cleanText(value).toLowerCase();
  if (/certified material.*not in line|scope certificate|\u6750\u8d28.*\u8bc1\u4e66|\u8bc1\u4e66.*\u6750\u8d28/.test(text)) {
    return "\u8ba4\u8bc1\u6750\u8d28\u4e0e\u8bc1\u4e66\u4e0d\u4e00\u81f4";
  }
  if (/less than 50%|organic.*recycled content|\u5360\u6bd4.*\u4e0d\u8db3|\u4f4e\u4e8e\s*50/.test(text)) {
    return "\u56de\u6536/\u6709\u673a\u6750\u8d28\u5360\u6bd4\u4e0d\u8db3";
  }
  if (/product type.*does not match|\u4ea7\u54c1\u7c7b\u578b.*\u4e0d\u5339\u914d|\u54c1\u7c7b.*\u6587\u6863/.test(text)) {
    return "\u4ea7\u54c1\u7c7b\u578b\u4e0e\u6587\u6863\u4e0d\u5339\u914d";
  }
  if (/not found in amazon catalog|amazon catalog|\u4e9a\u9a6c\u900a\u76ee\u5f55.*\u672a\u627e\u5230/.test(text)) {
    return "Amazon\u76ee\u5f55\u672a\u627e\u5230\u4ea7\u54c1";
  }
  if (/brand|trademark|\u54c1\u724c|\u5546\u6807|\u975ejt/.test(text)) {
    return "\u54c1\u724c/\u5546\u6807\u95ee\u9898";
  }
  if (/certificate|document|material|\u8bc1\u4e66|\u6750\u6599|\u8d44\u6599|\u6587\u6863/.test(text)) {
    return "\u8bc1\u4e66/\u6750\u6599\u95ee\u9898";
  }
  if (/asin|sku|upc|ean|\u7f16\u7801|\u4fe1\u606f\u4e0d\u4e00\u81f4/.test(text)) {
    return "ASIN/SKU\u4fe1\u606f\u95ee\u9898";
  }
  if (/\u672a\u5230\u8d27|\u65b0\u54c1/.test(text)) return "\u65b0\u54c1/\u5230\u8d27\u8fdb\u5ea6";
  if (!text) return "\u539f\u56e0\u672a\u586b\u5199";
  return "\u5176\u4ed6/\u672a\u5206\u7c7b";
}

export function normalizeRecord(raw) {
  const reasons = uniqueText(raw.reasons, "\u539f\u56e0\u672a\u586b\u5199");
  return {
    asin: cleanText(raw.asin),
    skus: uniqueText(raw.skus),
    systemSkus: uniqueText(raw.systemSkus),
    categories: uniqueText(raw.categories),
    operators: uniqueText(raw.operators),
    productOwners: uniqueText(raw.productOwners),
    status: cleanText(raw.status) || "\u5f85\u5904\u7406",
    oldStatus: cleanText(raw.oldStatus) || "\u672a\u586b\u5199",
    latestStatus: cleanText(raw.latestStatus) || "\u672a\u586b\u5199",
    unlistedReason: cleanText(raw.unlistedReason) || "\u672a\u586b\u5199",
    reasons,
    reasonGroups: [...new Set(reasons.map(classifyFailure))],
    rejectionCount: Number(raw.rejectionCount ?? 0),
    wasRejected: Boolean(raw.wasRejected),
    sourceRow: Number(raw.sourceRow ?? 0),
  };
}

function matchesSelection(values, selected) {
  if (!selected || selected.size === 0) return true;
  return values.some((value) => selected.has(value));
}

export function filterRecords(records, state) {
  const query = cleanText(state.query).toLowerCase();
  return records.filter((row) => {
    if (!matchesSelection(row.categories, state.categories)) return false;
    if (!matchesSelection(row.skus, state.skus)) return false;
    if (!matchesSelection(row.operators, state.operators)) return false;
    if (state.statuses?.size && !state.statuses.has(row.status)) return false;
    if (!query) return true;
    const haystack = [
      row.asin,
      ...row.skus,
      ...row.systemSkus,
      ...row.categories,
      ...row.operators,
      ...row.productOwners,
      row.status,
      row.unlistedReason,
      ...row.reasons,
      ...row.reasonGroups,
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

export function summarizeRecords(records) {
  const result = { total: records.length, success: 0, failure: 0, pending: 0, successRate: 0 };
  for (const row of records) {
    if (row.status === "\u6210\u529f") result.success += 1;
    else if (row.status === "\u5931\u8d25") result.failure += 1;
    else result.pending += 1;
  }
  result.successRate = result.total ? result.success / result.total : 0;
  return result;
}

export function countBy(records, getter) {
  const result = new Map();
  for (const record of records) {
    const keys = Array.isArray(getter(record)) ? getter(record) : [getter(record)];
    for (const key of new Set(keys)) result.set(key, (result.get(key) ?? 0) + 1);
  }
  return [...result.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "zh-CN"));
}
