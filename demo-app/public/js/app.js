/**
 * InsureFlow demo application core: auth, data store, pricing rules, formatting and shared UI.
 * Data lives in localStorage per user so every Playwright browser context starts from a clean seed.
 */
(function () {
  'use strict';

  const SESSION_KEY = 'insureflow.session';
  const DB_PREFIX = 'insureflow.db:';
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const CLOSED_CLAIM_STATUSES = ['Approved', 'Rejected', 'Closed'];

  const USERS = {
    'alex.morgan@insureflow.test': { password: 'Secure@123', firstName: 'Alex', lastName: 'Morgan', locked: false },
    'priya.shah@insureflow.test': { password: 'Secure@123', firstName: 'Priya', lastName: 'Shah', locked: false },
    'locked.user@insureflow.test': { password: 'Secure@123', firstName: 'Lena', lastName: 'Park', locked: true },
  };

  const SEED = {
    'alex.morgan@insureflow.test': {
      policies: [
        { policyNumber: 'IF-AUT-100245', type: 'auto', tier: 'standard', insuredItem: '2021 Toyota Corolla', status: 'Active', coverage: 24000, premium: 960, startDate: '2026-03-01', renewalDate: '2027-03-01' },
        { policyNumber: 'IF-HOM-200871', type: 'home', tier: 'standard', insuredItem: '12 Sukhumvit Residence, Bangkok', status: 'Active', coverage: 360000, premium: 2160, startDate: '2026-01-15', renewalDate: '2027-01-15' },
        { policyNumber: 'IF-TRV-300512', type: 'travel', tier: 'standard', insuredItem: 'Annual multi-trip - Asia', status: 'Expired', coverage: 12000, premium: 240, startDate: '2025-02-10', renewalDate: '2026-02-10' },
        { policyNumber: 'IF-AUT-100389', type: 'auto', tier: 'basic', insuredItem: '2019 Honda Civic', status: 'Pending', coverage: 18000, premium: 576, startDate: '2026-12-01', renewalDate: '2027-12-01' },
        { policyNumber: 'IF-HLT-400118', type: 'health', tier: 'premium', insuredItem: 'Individual health plan', status: 'Active', coverage: 50000, premium: 2025, startDate: '2026-05-20', renewalDate: '2027-05-20' },
        { policyNumber: 'IF-HOM-200455', type: 'home', tier: 'basic', insuredItem: 'Riverside Condo, Chiang Mai', status: 'Active', coverage: 150000, premium: 720, startDate: '2026-07-01', renewalDate: '2027-07-01' },
      ],
      claims: [
        { claimId: 'CLM-50012', policyNumber: 'IF-AUT-100245', incidentType: 'Collision', incidentDate: '2026-06-14', amount: 1850, status: 'Approved', description: 'Rear-end collision at a traffic light, bumper and tail light damaged.' },
        { claimId: 'CLM-50027', policyNumber: 'IF-HOM-200871', incidentType: 'Water damage', incidentDate: '2026-09-02', amount: 4200, status: 'In review', description: 'Burst pipe in the kitchen damaged flooring and lower cabinets.' },
      ],
    },
  };

  const PRICING = {
    rates: { auto: 0.04, home: 0.006, travel: 0.02, health: 0.03 },
    tierMultipliers: { basic: 0.8, standard: 1, premium: 1.35 },
    minimumPremium: 99,
  };

  const LABELS = { auto: 'Auto', home: 'Home', travel: 'Travel', health: 'Health', basic: 'Basic', standard: 'Standard', premium: 'Premium' };
  const POLICY_PREFIX = { auto: 'AUT', home: 'HOM', travel: 'TRV', health: 'HLT' };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const round2 = (value) => Math.round(value * 100) / 100;

  // ---------- dates (local calendar dates, ISO yyyy-mm-dd) ----------
  const dates = {
    toIso(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },
    parse(iso) {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y, m - 1, d);
    },
    today() {
      return dates.toIso(new Date());
    },
    addYears(iso, years) {
      const date = dates.parse(iso);
      date.setFullYear(date.getFullYear() + years);
      return dates.toIso(date);
    },
    daysBetween(fromIso, toIso) {
      return Math.round((dates.parse(toIso) - dates.parse(fromIso)) / 86400000);
    },
    isValidIso(value) {
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(dates.parse(value).getTime());
    },
  };

  // ---------- formatting ----------
  const format = {
    currency(amount) {
      return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    label(key) {
      return LABELS[key] || key;
    },
    parseAmount(raw) {
      const cleaned = String(raw).replace(/[,$\s]/g, '');
      if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
      return Number(cleaned);
    },
  };

  // ---------- auth ----------
  const auth = {
    login(email, password) {
      const key = email.trim().toLowerCase();
      const user = USERS[key];
      if (!user || user.password !== password) {
        return { ok: false, error: 'Invalid email or password. Please try again.' };
      }
      if (user.locked) {
        return { ok: false, error: 'Your account has been locked. Please contact customer support.' };
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email: key, loggedInAt: new Date().toISOString() }));
      db.load();
      return { ok: true };
    },
    logout() {
      localStorage.removeItem(SESSION_KEY);
    },
    currentUser() {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      try {
        const session = JSON.parse(raw);
        const user = USERS[session.email];
        return user ? { email: session.email, firstName: user.firstName, lastName: user.lastName } : null;
      } catch (error) {
        return null;
      }
    },
    requireAuth() {
      const user = auth.currentUser();
      if (!user) {
        const target = (location.pathname.split('/').pop() || 'dashboard.html') + location.search;
        location.replace('login.html?redirect=' + encodeURIComponent(target));
        return null;
      }
      return user;
    },
  };

  // ---------- data store ----------
  const db = {
    key() {
      const user = auth.currentUser();
      return DB_PREFIX + (user ? user.email : 'anonymous');
    },
    load() {
      const key = db.key();
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (error) {
          /* fall through and reseed */
        }
      }
      const seed = clone(SEED[key.slice(DB_PREFIX.length)] || { policies: [], claims: [] });
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    },
    save(data) {
      localStorage.setItem(db.key(), JSON.stringify(data));
    },
    policies() {
      return db.load().policies;
    },
    claims() {
      return db.load().claims;
    },
    getPolicy(policyNumber) {
      return db.policies().find((p) => p.policyNumber === policyNumber) || null;
    },
    addPolicy(policy) {
      const data = db.load();
      data.policies.push(policy);
      db.save(data);
    },
    addClaim(claim) {
      const data = db.load();
      data.claims.unshift(claim);
      db.save(data);
    },
    isClaimOpen(claim) {
      return !CLOSED_CLAIM_STATUSES.includes(claim.status);
    },
  };

  // ---------- business rules ----------
  const pricing = {
    rules: PRICING,
    annualPremium(type, tier, coverage) {
      const raw = coverage * PRICING.rates[type] * PRICING.tierMultipliers[tier];
      return Math.max(PRICING.minimumPremium, round2(raw));
    },
    monthlyPremium(annual) {
      return round2(annual / 12);
    },
  };

  const ids = {
    policyNumber(type) {
      const existing = new Set(db.policies().map((p) => p.policyNumber));
      let candidate;
      do {
        candidate = `IF-${POLICY_PREFIX[type]}-${Math.floor(100000 + Math.random() * 900000)}`;
      } while (existing.has(candidate));
      return candidate;
    },
    claimId() {
      const existing = new Set(db.claims().map((c) => c.claimId));
      let candidate;
      do {
        candidate = `CLM-${Math.floor(60000 + Math.random() * 39999)}`;
      } while (existing.has(candidate));
      return candidate;
    },
  };

  // ---------- UI helpers ----------
  const ui = {
    escape(value) {
      return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    },
    byTestId(testId, root = document) {
      return root.querySelector(`[data-testid="${testId}"]`);
    },
    show(element, text) {
      if (text !== undefined) element.textContent = text;
      element.hidden = false;
    },
    hide(element) {
      element.hidden = true;
    },
    setFieldError(form, field, message) {
      const error = form.querySelector(`[data-error-for="${field}"]`);
      if (error) ui.show(error, message);
      form.querySelectorAll(`[name="${field}"]`).forEach((input) => input.setAttribute('aria-invalid', 'true'));
    },
    clearErrors(form) {
      form.querySelectorAll('[data-error-for]').forEach((error) => {
        error.textContent = '';
        error.hidden = true;
      });
      form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
    },
    renderHeader(activePage) {
      const user = auth.currentUser();
      const container = document.getElementById('app-header');
      if (!container || !user) return;
      const links = [
        { id: 'dashboard', href: 'dashboard.html', label: 'Dashboard' },
        { id: 'policies', href: 'policies.html', label: 'My Policies' },
        { id: 'quote', href: 'quote.html', label: 'Get a Quote' },
        { id: 'claims', href: 'claims.html', label: 'Claims' },
      ];
      container.innerHTML = `
        <header class="app-header" data-testid="app-header">
          <a class="brand" href="dashboard.html">InsureFlow</a>
          <nav aria-label="Main">
            ${links
              .map(
                (link) =>
                  `<a href="${link.href}" data-testid="nav-${link.id}"${link.id === activePage ? ' aria-current="page" class="active"' : ''}>${link.label}</a>`
              )
              .join('')}
          </nav>
          <div class="user-menu">
            <span data-testid="user-name">${ui.escape(user.firstName + ' ' + user.lastName)}</span>
            <button type="button" class="btn btn-link" data-testid="logout-button">Sign out</button>
          </div>
        </header>`;
      ui.byTestId('logout-button', container).addEventListener('click', () => {
        auth.logout();
        location.assign('login.html?loggedOut=1');
      });
    },
  };

  window.InsureFlow = { auth, db, pricing, ids, dates, format, ui, EMAIL_PATTERN, LABELS };
})();
