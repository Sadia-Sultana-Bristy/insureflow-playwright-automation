/**
 * Date helpers that produce ISO (yyyy-mm-dd) strings in the local calendar,
 * matching how the application interprets <input type="date"> values.
 */
function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today shifted by `days` (negative = past, positive = future). */
function daysFromToday(days = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function addYears(isoDate, years) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setFullYear(date.getFullYear() + years);
  return toIsoDate(date);
}

module.exports = { toIsoDate, daysFromToday, addYears };
