/** Formats a number the same way the UI does, e.g. 5865 -> "$5,865.00". */
function formatCurrency(amount) {
  return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parses UI currency text back into a number, e.g. "$2,160.00" -> 2160. */
function parseCurrency(text) {
  const value = Number(String(text).replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(value)) throw new Error(`Unable to parse currency value from "${text}"`);
  return value;
}

module.exports = { formatCurrency, parseCurrency };
