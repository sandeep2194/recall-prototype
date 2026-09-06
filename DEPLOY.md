# Deploying the prototype

Hosted on Cloudflare Pages behind Cloudflare Access, so the design reference is
shareable with the three people who need it and nobody else.

    https://recall-prototype.pages.dev

## What gets deployed

`docs/`, not `dist/`. That is deliberate and worth knowing before you "fix" it:
`index.html` loads `./assets/index.js` as a CLASSIC script so the prototype can
be opened straight off disk with `file://`, and Vite therefore refuses to bundle
it ("can't be bundled without type=module"). `npm run build` produces a 0.03 kB
stub. `docs/` holds the real 762 kB build, published for GitHub Pages, and is
what everyone has actually been looking at.

If you change `src/App.jsx`, rebuild the `docs/` bundle the way it was built
before, then deploy.

## Deploy

```bash
cd ~/recall/prototype
CLOUDFLARE_ACCOUNT_ID=19eb5603edecedab5e48d7498c8db731 \
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_REVIVOTECH_API_TOKEN" \
  npx wrangler pages deploy docs --project-name=recall-prototype --branch=master
```

Cloudflare account B (`revivotech`), the same one that serves hellosandeep.com.
`CLOUDFLARE_API_TOKEN` in the environment belongs to account A and has neither
Pages nor R2 — passing the revivotech token explicitly is not optional.

## Access

Zero Trust org `sandeep2194.cloudflareaccess.com`. One application,
`Recall prototype`, one allow policy naming four addresses:

    sandeepcn998@gmail.com
    seyon31@gmail.com
    skyblue_lankan@hotmail.com
    krishnnas@outlook.com

Anyone else gets Cloudflare's sign-in page and never reaches the app — verified
by requesting the site unauthenticated and confirming the redirect to
`/cdn-cgi/access/login/` with `auth_status: NONE`.

To change who has access, edit that policy (Zero Trust dashboard → Access →
Applications → Recall prototype) or PATCH
`/accounts/{account}/access/apps/{app}/policies/{policy}`. Adding a person means
adding their address; there is no domain rule, on purpose.
