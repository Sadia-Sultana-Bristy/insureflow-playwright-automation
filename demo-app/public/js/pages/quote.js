(function () {
  'use strict';
  const { auth, db, pricing, ids, dates, format, ui } = window.InsureFlow;
  if (!auth.requireAuth()) return;
  ui.renderHeader('quote');

  const MIN_COVERAGE = 1000;
  const MAX_COVERAGE = 2000000;
  const MAX_START_DAYS = 90;

  const form = document.getElementById('quote-form');
  const steps = [1, 2, 3].map((n) => ui.byTestId(`quote-step-${n}`));
  const indicator = ui.byTestId('quote-step-indicator');
  let quote = null;

  function goToStep(step) {
    steps.forEach((section, index) => {
      section.hidden = index !== step - 1;
    });
    indicator.textContent = `Step ${step} of 3`;
  }

  function selected(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  }

  function validateStep1() {
    ui.clearErrors(form);
    let valid = true;
    if (!selected('productType')) {
      ui.setFieldError(form, 'productType', 'Select a product');
      valid = false;
    }
    if (!selected('tier')) {
      ui.setFieldError(form, 'tier', 'Select a coverage tier');
      valid = false;
    }
    return valid;
  }

  function validateStep2() {
    ui.clearErrors(form);
    let valid = true;
    const insuredItem = form.insuredItem.value.trim();
    const coverageRaw = form.coverage.value.trim();
    const startDate = form.startDate.value;

    if (!insuredItem) {
      ui.setFieldError(form, 'insuredItem', 'Tell us what you are insuring');
      valid = false;
    } else if (insuredItem.length < 3) {
      ui.setFieldError(form, 'insuredItem', 'Insured item must be at least 3 characters');
      valid = false;
    }

    if (!coverageRaw) {
      ui.setFieldError(form, 'coverage', 'Coverage amount is required');
      valid = false;
    } else {
      const coverage = format.parseAmount(coverageRaw);
      if (Number.isNaN(coverage)) {
        ui.setFieldError(form, 'coverage', 'Enter a valid amount');
        valid = false;
      } else if (coverage < MIN_COVERAGE || coverage > MAX_COVERAGE) {
        ui.setFieldError(form, 'coverage', 'Coverage amount must be between $1,000.00 and $2,000,000.00');
        valid = false;
      }
    }

    if (!startDate) {
      ui.setFieldError(form, 'startDate', 'Start date is required');
      valid = false;
    } else if (!dates.isValidIso(startDate)) {
      ui.setFieldError(form, 'startDate', 'Enter a valid date');
      valid = false;
    } else {
      const offset = dates.daysBetween(dates.today(), startDate);
      if (offset < 0) {
        ui.setFieldError(form, 'startDate', 'Start date cannot be in the past');
        valid = false;
      } else if (offset > MAX_START_DAYS) {
        ui.setFieldError(form, 'startDate', 'Start date must be within the next 90 days');
        valid = false;
      }
    }
    return valid;
  }

  function buildQuote() {
    const type = selected('productType');
    const tier = selected('tier');
    const coverage = format.parseAmount(form.coverage.value);
    const annual = pricing.annualPremium(type, tier, coverage);
    return {
      type,
      tier,
      coverage,
      insuredItem: form.insuredItem.value.trim(),
      startDate: form.startDate.value,
      annualPremium: annual,
      monthlyPremium: pricing.monthlyPremium(annual),
    };
  }

  function renderReview() {
    ui.byTestId('review-product').textContent = format.label(quote.type);
    ui.byTestId('review-tier').textContent = format.label(quote.tier);
    ui.byTestId('review-insured-item').textContent = quote.insuredItem;
    ui.byTestId('review-coverage').textContent = format.currency(quote.coverage);
    ui.byTestId('review-start-date').textContent = quote.startDate;
    ui.byTestId('quote-annual-premium').textContent = format.currency(quote.annualPremium);
    ui.byTestId('quote-monthly-premium').textContent = format.currency(quote.monthlyPremium);
  }

  ui.byTestId('step-1-next').addEventListener('click', () => {
    if (validateStep1()) goToStep(2);
  });
  ui.byTestId('step-2-back').addEventListener('click', () => {
    ui.clearErrors(form);
    goToStep(1);
  });
  ui.byTestId('step-2-next').addEventListener('click', () => {
    if (!validateStep2()) return;
    quote = buildQuote();
    renderReview();
    goToStep(3);
  });
  ui.byTestId('step-3-back').addEventListener('click', () => {
    ui.clearErrors(form);
    goToStep(2);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ui.clearErrors(form);
    if (!form.acceptTerms.checked) {
      ui.setFieldError(form, 'acceptTerms', 'You must accept the terms and conditions to continue');
      return;
    }
    const policy = {
      policyNumber: ids.policyNumber(quote.type),
      type: quote.type,
      tier: quote.tier,
      insuredItem: quote.insuredItem,
      status: quote.startDate === dates.today() ? 'Active' : 'Pending',
      coverage: quote.coverage,
      premium: quote.annualPremium,
      startDate: quote.startDate,
      renewalDate: dates.addYears(quote.startDate, 1),
    };
    db.addPolicy(policy);

    form.hidden = true;
    ui.byTestId('confirmation-policy-number').textContent = policy.policyNumber;
    ui.byTestId('confirmation-status').textContent = policy.status;
    ui.byTestId('view-policy-link').href = `policy.html?id=${encodeURIComponent(policy.policyNumber)}`;
    ui.show(ui.byTestId('quote-confirmation'));
  });

  goToStep(1);
})();
