(function () {
  'use strict';
  const { auth, db, format, ui } = window.InsureFlow;
  if (!auth.requireAuth()) return;
  ui.renderHeader('policies');

  const policyNumber = new URLSearchParams(location.search).get('id') || '';
  const policy = db.getPolicy(policyNumber);

  if (!policy) {
    ui.show(ui.byTestId('policy-not-found'));
    return;
  }

  const fields = {
    'policy-number': policy.policyNumber,
    'policy-type': format.label(policy.type),
    'policy-tier': format.label(policy.tier),
    'policy-insured-item': policy.insuredItem,
    'policy-status': policy.status,
    'policy-coverage': format.currency(policy.coverage),
    'policy-premium': format.currency(policy.premium),
    'policy-start-date': policy.startDate,
    'policy-renewal-date': policy.renewalDate,
  };
  Object.entries(fields).forEach(([testId, value]) => {
    ui.byTestId(testId).textContent = value;
  });

  if (policy.status === 'Active') {
    const claimButton = ui.byTestId('file-claim-button');
    claimButton.href = `claims.html?policy=${encodeURIComponent(policy.policyNumber)}`;
    claimButton.hidden = false;
  }
  document.title = `${policy.policyNumber} | InsureFlow`;
  ui.show(ui.byTestId('policy-details'));
})();
