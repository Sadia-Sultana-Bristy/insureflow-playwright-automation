(function () {
  'use strict';
  const { auth, db, ids, dates, format, ui } = window.InsureFlow;
  if (!auth.requireAuth()) return;
  ui.renderHeader('claims');

  const MIN_DESCRIPTION = 20;
  const form = document.getElementById('claim-form');
  const policySelect = ui.byTestId('claim-policy');
  const description = ui.byTestId('claim-description');
  const counter = ui.byTestId('description-counter');
  const success = ui.byTestId('claim-success');
  const table = ui.byTestId('claims-table');
  const emptyState = ui.byTestId('claims-empty-state');

  const activePolicies = db.policies().filter((p) => p.status === 'Active');

  if (activePolicies.length === 0) {
    form.hidden = true;
    ui.show(ui.byTestId('claim-no-policies'));
  }

  activePolicies.forEach((p) => {
    const option = document.createElement('option');
    option.value = p.policyNumber;
    option.textContent = `${p.policyNumber} — ${p.insuredItem}`;
    policySelect.appendChild(option);
  });

  const preselected = new URLSearchParams(location.search).get('policy');
  if (preselected && activePolicies.some((p) => p.policyNumber === preselected)) {
    policySelect.value = preselected;
  }

  form.incidentDate.max = dates.today();

  function updateCounter() {
    counter.textContent = `${description.value.length} / 500`;
  }
  description.addEventListener('input', updateCounter);

  function renderClaims() {
    const claims = db.claims();
    table.querySelector('tbody').innerHTML = claims
      .map(
        (c) => `
        <tr data-testid="claim-row">
          <td data-testid="cell-claim-id">${c.claimId}</td>
          <td data-testid="cell-claim-policy">${c.policyNumber}</td>
          <td data-testid="cell-claim-type">${ui.escape(c.incidentType)}</td>
          <td data-testid="cell-claim-date">${c.incidentDate}</td>
          <td data-testid="cell-claim-amount">${format.currency(c.amount)}</td>
          <td data-testid="cell-claim-status"><span class="badge badge-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span></td>
        </tr>`
      )
      .join('');
    table.hidden = claims.length === 0;
    emptyState.hidden = claims.length !== 0;
  }

  function validate() {
    ui.clearErrors(form);
    let valid = true;
    const policy = db.getPolicy(form.policyNumber.value);
    const incidentDate = form.incidentDate.value;
    const amountRaw = form.amount.value.trim();
    const text = form.description.value.trim();

    if (!policy) {
      ui.setFieldError(form, 'policyNumber', 'Select a policy');
      valid = false;
    }
    if (!form.incidentType.value) {
      ui.setFieldError(form, 'incidentType', 'Select an incident type');
      valid = false;
    }

    if (!incidentDate) {
      ui.setFieldError(form, 'incidentDate', 'Incident date is required');
      valid = false;
    } else if (dates.daysBetween(dates.today(), incidentDate) > 0) {
      ui.setFieldError(form, 'incidentDate', 'Incident date cannot be in the future');
      valid = false;
    } else if (policy && incidentDate < policy.startDate) {
      ui.setFieldError(form, 'incidentDate', `Incident date cannot be before the policy start date (${policy.startDate})`);
      valid = false;
    }

    if (!amountRaw) {
      ui.setFieldError(form, 'amount', 'Claim amount is required');
      valid = false;
    } else {
      const amount = format.parseAmount(amountRaw);
      if (Number.isNaN(amount)) {
        ui.setFieldError(form, 'amount', 'Enter a valid amount');
        valid = false;
      } else if (amount <= 0) {
        ui.setFieldError(form, 'amount', 'Claim amount must be greater than $0.00');
        valid = false;
      } else if (policy && amount > policy.coverage) {
        ui.setFieldError(form, 'amount', `Claim amount cannot exceed the policy coverage of ${format.currency(policy.coverage)}`);
        valid = false;
      }
    }

    if (text.length < MIN_DESCRIPTION) {
      ui.setFieldError(form, 'description', `Description must be at least ${MIN_DESCRIPTION} characters`);
      valid = false;
    }
    return valid;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ui.hide(success);
    if (!validate()) return;

    const claim = {
      claimId: ids.claimId(),
      policyNumber: form.policyNumber.value,
      incidentType: form.incidentType.value,
      incidentDate: form.incidentDate.value,
      amount: format.parseAmount(form.amount.value),
      status: 'Submitted',
      description: form.description.value.trim(),
    };
    db.addClaim(claim);

    ui.byTestId('claim-reference').textContent = claim.claimId;
    ui.show(success);
    form.reset();
    updateCounter();
    renderClaims();
  });

  updateCounter();
  renderClaims();
})();
