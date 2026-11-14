(function () {
  'use strict';
  const { auth, db, format, ui } = window.InsureFlow;
  if (!auth.requireAuth()) return;
  ui.renderHeader('policies');

  const search = ui.byTestId('policy-search');
  const typeFilter = ui.byTestId('filter-type');
  const statusFilter = ui.byTestId('filter-status');
  const sortBy = ui.byTestId('sort-by');
  const table = ui.byTestId('policies-table');
  const tbody = table.querySelector('tbody');
  const emptyState = ui.byTestId('policies-empty-state');
  const resultsCount = ui.byTestId('results-count');

  const sorters = {
    '': (a, b) => a.policyNumber.localeCompare(b.policyNumber),
    'premium-asc': (a, b) => a.premium - b.premium,
    'premium-desc': (a, b) => b.premium - a.premium,
    'renewal-asc': (a, b) => a.renewalDate.localeCompare(b.renewalDate),
  };

  function render() {
    const all = db.policies();
    const term = search.value.trim().toLowerCase();
    const rows = all
      .filter((p) => !term || p.policyNumber.toLowerCase().includes(term) || p.insuredItem.toLowerCase().includes(term))
      .filter((p) => !typeFilter.value || p.type === typeFilter.value)
      .filter((p) => !statusFilter.value || p.status === statusFilter.value)
      .sort(sorters[sortBy.value]);

    resultsCount.textContent = `Showing ${rows.length} of ${all.length} policies`;
    tbody.innerHTML = rows
      .map(
        (p) => `
        <tr data-testid="policy-row">
          <td data-testid="cell-policy-number"><a href="policy.html?id=${encodeURIComponent(p.policyNumber)}">${p.policyNumber}</a></td>
          <td data-testid="cell-type">${format.label(p.type)}</td>
          <td data-testid="cell-insured-item">${ui.escape(p.insuredItem)}</td>
          <td data-testid="cell-status"><span class="badge badge-${p.status.toLowerCase()}">${p.status}</span></td>
          <td data-testid="cell-premium">${format.currency(p.premium)}</td>
          <td data-testid="cell-renewal-date">${p.renewalDate}</td>
        </tr>`
      )
      .join('');
    table.hidden = rows.length === 0;
    emptyState.hidden = rows.length !== 0;
  }

  search.addEventListener('input', render);
  [typeFilter, statusFilter, sortBy].forEach((control) => control.addEventListener('change', render));
  ui.byTestId('clear-filters').addEventListener('click', () => {
    search.value = '';
    typeFilter.value = '';
    statusFilter.value = '';
    sortBy.value = '';
    render();
  });

  render();
})();
