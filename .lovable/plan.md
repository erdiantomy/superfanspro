

## Add Email Notification for New Venue Registrations

When a new venue submits a registration at `/register`, you'll receive an email at `erdian.tomy@gmail.com` with the venue details so you never miss a pending approval.

### What will be built

1. **Email infrastructure setup** — Set up the email queue, tables, and processing pipeline using the verified `notify.nosecret.co` domain.

2. **Scaffold transactional email system** — Create the `send-transactional-email` Edge Function and supporting infrastructure (unsubscribe handling, suppression).

3. **Create "New Registration" email template** — A branded React Email template showing:
   - Venue name, slug, city, country
   - Contact name, email, phone
   - Court count, monthly prize amount
   - A CTA button linking to `/superadmin`

4. **Wire up the trigger** — After a successful venue registration insert in `RegisterPage.tsx`, invoke `send-transactional-email` to send the notification to your admin email.

5. **Create unsubscribe page** — Required by the transactional email system (standard compliance page).

6. **Deploy Edge Functions** — Deploy `send-transactional-email` and related functions.

### Technical details

- **Sender**: `noreply@nosecret.co` (via verified `notify.nosecret.co`)
- **Recipient**: `erdian.tomy@gmail.com` (hardcoded as admin email)
- **Template**: `new-venue-registration` in `_shared/transactional-email-templates/`
- **Trigger point**: `RegisterPage.tsx` `submit()` function, after successful insert
- **Idempotency key**: `venue-reg-${registrationId}` to prevent duplicates
- **Styling**: Dark theme matching SuperFans branding (green accent `#00E676`, dark background cards) with white email body background per email standards

