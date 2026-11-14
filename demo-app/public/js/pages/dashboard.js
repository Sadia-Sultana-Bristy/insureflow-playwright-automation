(function () {
  'use strict';
  const { auth, db, format, ui } = window.InsureFlow;
  const user = auth.requireAuth();
  if (!user) return;
  ui.renderHeader('dashboard');

  const policies = db.policies();
  const active = policies.filter((p) => p.status === 'Active');
  const openClaims = db.claims().filter(db.isClaimOpen);
  const annualTotal = active.reduce((sum, p) => sum + p.premium, 0);

  ui.byTestId('welcome-message').textContent = `Welcome back, ${user.firstName}`;
  ui.byTestId('active-policies-count').textContent = String(active.length);
  ui.byTestId('open-claims-count').textContent = String(openClaims.length);
  ui.byTestId('annual-premium-total').textContent = format.currency(annualTotal);

  const list = ui.byTestId('active-policy-list');
  if (policies.length === 0) {
    ui.show(ui.byTestId('dashboard-empty-state'));
    list.hidden = true;
    return;
  }
  list.innerHTML = active
    .map(
      (p) =>
        `<li data-testid="active-policy-item"><a href="policy.html?id=${encodeURIComponent(p.policyNumber)}">${p.policyNumber}</a> — ${format.label(p.type)} · ${ui.escape(p.insuredItem)}</li>`
    )
    .join('');
})();
