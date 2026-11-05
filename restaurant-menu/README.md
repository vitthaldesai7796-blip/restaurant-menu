# Restaurant Digital Menu + Admin Panel

React + Vite + Tailwind CSS, with Supabase (database, login, image storage, realtime) and Cloudflare Pages hosting. Everything works on free tiers.

* Customer menu: `/`
* Admin panel: `/admin` (dashboard, dishes, categories, restaurant settings, QR code)

---------------------------------------------------------------------

## Part A. Create the Supabase backend (about 10 minutes)

1. Go to https://supabase.com, sign up (free) and click **New project**. Pick a name, a strong database password (save it) and the region nearest your customers (e.g. Mumbai). Wait until it finishes.
2. **Database setup:** left menu **SQL Editor > New query**. Open `supabase/schema.sql` from this project, copy everything, paste, click **Run**. You should see "Success". This creates the tables, security rules (RLS), the image bucket, realtime and the 9 default categories.
3. **Create your admin login:** left menu **Authentication > Users > Add user > Create new user**. Enter your email and a strong password, tick **Auto Confirm User**, create.
4. **Authorize that user as admin:** back in **SQL Editor**, run (use your own email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'owner@example.com';
   ```
   Only users listed in the `admins` table can change anything. Others are blocked by the database itself.
5. **Disable public sign-ups:** **Authentication > Sign In / Providers** (or Settings) and turn **off** "Allow new users to sign up". There is no registration page in the app either.
6. **Check storage:** **Storage** should show a bucket `menu-images` (marked public). The SQL created it; nothing else to do.
7. **Check realtime (optional):** **Database > Replication** (or Publications > supabase_realtime) should list `dishes`, `categories`, `restaurant_settings`. Even if not, the menu still refreshes every 60 seconds and when the tab is reopened.
8. **Copy your two keys:** **Project Settings > API** (or "API Keys"):
   * **Project URL** -> `VITE_SUPABASE_URL`
   * **anon / public key** -> `VITE_SUPABASE_ANON_KEY`

   Never use or share the `service_role` key. This project does not need it.

## Part B. Run it on your computer (optional but recommended)

Install Node.js 18+ from https://nodejs.org, then in this folder:

```bash
cp .env.example .env      # Windows: copy .env.example .env
# open .env and paste your two values
npm install
npm run dev               # open the address it prints, e.g. http://localhost:5173
```
Open `/admin`, sign in, then fill **Restaurant settings**, add dishes, and open `/` to see them.

## Part C. Put the code on GitHub

1. Create a free account at https://github.com and click **New repository** (name e.g. `restaurant-menu`, keep it Private or Public). Do not add a README.
2. In this folder run:
   ```bash
   git init
   git add .
   git commit -m "Restaurant menu"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/restaurant-menu.git
   git push -u origin main
   ```
   `.env` is in `.gitignore`, so your keys are not uploaded (the anon key is public-safe anyway).

## Part D. Publish on Cloudflare Pages (free)

1. Sign up at https://dash.cloudflare.com. Go to **Workers & Pages > Create > Pages > Connect to Git** and choose your repository.
2. Build settings:
   * Framework preset: **Vite** (or None)
   * Build command: `npm run build`
   * Build output directory: `dist`
3. **Environment variables:** add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your values, and also `NODE_VERSION` = `20`.
4. Click **Save and Deploy**. After a minute your site is live at `https://YOUR-PROJECT.pages.dev`.
5. Open `https://YOUR-PROJECT.pages.dev/admin`, sign in, then go to **QR code** to download/print your QR.

(`public/_redirects` makes `/admin` work when opened directly.)

If you change the environment variables later, trigger a redeploy (Deployments > Retry/Redeploy), because Vite reads them at build time.

## Day-to-day use (no code changes ever)

Admin panel > Dishes: add, edit prices, toggle availability (the switch), delete. The customer menu updates automatically through Supabase Realtime (open customer pages refresh within about a second; fallback is every 60 s and on tab focus). Redeploying is never needed for menu changes.

## Security summary

* Public visitors: read-only access to categories, dishes, settings and images.
* Writes (insert/update/delete on all tables and the image bucket) require a signed-in user listed in `public.admins`, enforced by Row Level Security.
* No public registration; the first admin is created in the Supabase dashboard.
* Only the public anon key is in the frontend; keys live in environment variables.
* Admin routes redirect to the login page when not signed in as an admin.

## Test checklist (do this once after deploying)

1. Open `/admin` with a wrong password: you see an error. Sign in with the right one: dashboard opens. Log out: you return to login.
2. Open `/admin/dishes` in a private window while signed out: you are redirected to the login.
3. Add a category, add a dish with a photo from your phone: it appears in the dish list and on `/`.
4. Keep `/` open on a second device, change the dish price: it updates there without refresh.
5. Switch a dish to unavailable: it disappears from the default customer view.
6. Delete a dish (confirmation appears), edit settings, download the QR and scan it.
7. Refresh pages: data persists.

## Troubleshooting

* "Supabase is not configured": the two environment variables are missing; redeploy after adding.
* "Not allowed or nothing changed": your user is not in `public.admins` (redo step A4).
* Image upload fails: confirm the `menu-images` bucket exists and the SQL ran fully.
* Login says "not authorized": same as above; the account exists but is not an admin.
