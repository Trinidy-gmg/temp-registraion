# SendGrid dynamic template — email verification

1. In SendGrid: **Email API** → **Dynamic Templates** → **Create** a template.
2. Add a **Design** or **Code** version and paste the HTML from `verification-code.html`.
3. Define dynamic fields (SendGrid usually infers them from Handlebars):
   - `code` (required) — 8-digit string
   - `email` (optional) — recipient hint in the body
4. Copy the **Template ID** into RegistrationPage env: `SENDGRID_VERIFICATION_TEMPLATE_ID`.

### Minimal field set

If your editor does not support `{{#if email}}`, remove that block and keep only `{{code}}`.

### Testing

Use SendGrid’s test data or send a single recipient with `dynamic_template_data: { code: "12345678", email: "you@example.com" }`.
