/**
 * Reusable helpers for form validation messages.
 * Every field error in the app is rendered as <p data-error-for="fieldName">.
 */
class FormComponent {
  /** @param {import('@playwright/test').Locator} formRoot */
  constructor(formRoot) {
    this.root = formRoot;
  }

  errorFor(fieldName) {
    return this.root.locator(`[data-error-for="${fieldName}"]`);
  }

  visibleErrors() {
    return this.root.locator('[data-error-for]:visible');
  }
}

module.exports = { FormComponent };
