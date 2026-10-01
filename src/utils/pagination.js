
export const getPagination = ({ page = 1, limit = 10 }) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 10));
  return { page: p, limit: l, skip: (p - 1) * l };
};
export const buildMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });
