(function () {
  'use strict';
  const { auth, ui, EMAIL_PATTERN } = window.InsureFlow;

  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');
  const safeRedirect = redirect && /^[a-z-]+\.html(\?[\w=&%.-]*)?$/i.test(redirect) ? redirect : 'dashboard.html';

  if (auth.currentUser()) {
    location.replace(safeRedirect);
    return;
  }

  const form = document.getElementById('login-form');
  const info = ui.byTestId('login-info');
  const alertBox = ui.byTestId('login-alert');
  const button = ui.byTestId('login-button');

  if (redirect) ui.show(info, 'Please sign in to continue.');
  else if (params.has('loggedOut')) ui.show(info, 'You have been signed out successfully.');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ui.clearErrors(form);
    ui.hide(alertBox);

    const email = form.email.value.trim();
    const password = form.password.value;
    let valid = true;

    if (!email) {
      ui.setFieldError(form, 'email', 'Email is required');
      valid = false;
    } else if (!EMAIL_PATTERN.test(email)) {
      ui.setFieldError(form, 'email', 'Enter a valid email address');
      valid = false;
    }
    if (!password) {
      ui.setFieldError(form, 'password', 'Password is required');
      valid = false;
    }
    if (!valid) return;

    button.disabled = true;
    button.textContent = 'Signing in…';

    // Simulated network latency keeps the UI realistic (and proves the tests don't rely on hard waits).
    setTimeout(() => {
      const result = auth.login(email, password);
      if (result.ok) {
        location.assign(safeRedirect);
        return;
      }
      ui.show(alertBox, result.error);
      form.password.value = '';
      button.disabled = false;
      button.textContent = 'Sign in';
    }, 400);
  });
})();
