# Additional marketplace research

## Bottom line

These three sources are very different:

- **Facebook Marketplace**: no clean public buyer-side listings/search API; real-world automation is mostly scraping/browser automation and carries high risk.
- **Swappa**: I did **not** find public developer docs for a general buyer-side listings API, but Swappa does appear to support partner/business integrations in some form.
- **Back Market**: there **is** an official API, but it is clearly **seller/merchant-facing**, not a public buyer-side discovery API.

For Scoutrr, the practical pattern is:
- official API when one exists and fits the use case
- otherwise manual listing/manual URL support first
- scraping only as an explicit risk decision

---

## Facebook Marketplace

### API status

I did **not** find a public official API for consumer-side Marketplace search/listing ingestion.

What Meta does officially document is its **Commerce Platform / catalog** tooling on the developer platform. That stack is oriented around:
- commerce/catalog management
- inventory feeds
- merchant/shop workflows
- ads-commerce integrations

That is materially different from a public API for “search Facebook Marketplace listings near me for used tech.”

### Legitimate access methods

From a Scoutrr perspective, legitimate/defensible access looks very limited:

1. **Manual listing entry**
   - user pastes a Marketplace listing URL
   - user fills in title/price/condition manually if needed

2. **Seller-side commerce integrations**
   - relevant only if the seller controls inventory inside Meta’s commerce ecosystem
   - not useful for broad used-gear discovery across Marketplace

3. **Browser automation / scraping**
   - this is what most unofficial projects appear to do
   - examples found during research include GitHub scrapers and commercial scraping tools like Apify actors
   - this is not the same as a clean sanctioned API path

### What existing projects use

What I found in the wild:
- GitHub scraper projects for Facebook Marketplace
- paid scraper products and browser-automation vendors
- tooling that relies on logged-in sessions, headless browsers, selectors, cookies, and anti-bot workarounds

That strongly suggests the ecosystem is **scrape-first**, not API-first.

### Legal / ToS risk

Risk is high.

Meta has dedicated **Automated Data Collection Terms**, and Facebook is generally not a friendly target for unauthorized scraping. Even if a scraper technically works, it can run into:
- account risk
- login/session breakage
- anti-bot defenses
- legal/compliance review concerns

### Manual URL fallback

Recommended fallback if Marketplace matters:
- add/paste Marketplace URL into the existing manual-listing flow
- optionally attempt lightweight metadata extraction if fetch/parsing is possible
- otherwise let the user save it manually with platform badge `Facebook Marketplace`

### Recommendation

For Scoutrr:
- **Do not market Facebook Marketplace as a native automated integration right now**
- support it through **manual listing add / manual URL attach** first
- only consider automation if you’re willing to accept browser-automation fragility and platform risk

---

## Swappa

### API status

Swappa is more promising than Facebook Marketplace, but still unclear for Scoutrr’s buyer-side needs.

What I confirmed:
- I did **not** find public API docs at obvious endpoints like `/api`, `/developers`, or `/help/api`
- those routes returned 404 during research
- Swappa’s Terms of Use explicitly mention access by scraper/automated means being disallowed **except** where permitted by Swappa’s **API Terms of Use** or by prior written permission

That suggests some kind of API/approved integration path may exist, but it does **not** appear to be openly documented as a public self-serve buyer listings API.

### Legitimate access methods

The legitimate-looking paths I found:

1. **Partner / business integrations**
   - Swappa has a partners page
   - there is a specific `Swappa + Sellercloud` partner page describing listing/order workflow integration for business sellers
   - this points to controlled partner/business access rather than an open public listings API

2. **Manual listing entry**
   - very safe fallback
   - fits Scoutrr immediately

3. **Request permission / partner access**
   - if Swappa becomes important, this is the cleanest next step

### What existing projects use

What I found in the wild:
- unofficial GitHub scripts
- scraper products marketed for Swappa
- ecommerce integration platforms mentioning Swappa account/inventory integrations

That suggests a split ecosystem:
- some official/partner business integration exists
- consumer-side data pull for third parties is not obviously open/self-serve

### Legal / ToS risk

Swappa’s Terms are materially clearer than Craigslist’s, but still not friendly to unsanctioned scraping.

Notable point from their terms:
- they prohibit using robots, scrapers, or other automated means to access the site except where expressly permitted by Swappa’s API Terms of Use or prior written permission

So raw scraping is a risk unless Scoutrr has an approved integration path.

### Manual URL fallback

Good fallback:
- paste a Swappa listing URL into manual listing add
- optional parser can try to prefill title/price/image
- if parsing fails, keep the manual form as source of truth

### Recommendation

For Scoutrr:
- treat Swappa as **worth investigating further for official/partner access**
- do **not** assume there is a public buyer search API
- short term: support **manual URL/manual listing**
- medium term: contact Swappa for partner/API clarification if demand is real

---

## Back Market

### API status

Back Market clearly has an official API at:
- `https://api.backmarket.dev/`

I also verified its published OpenAPI bundle.

But the docs are explicit about what it is for:
- seller marketplace integration
- managing **Products**, **Offers**, and **Orders**
- synchronizing merchant inventory with Back Market
- authentication via token created in the Back Market back office

This is a real official API, but it is **merchant-facing**, not a general public API for buyer-side listing discovery across the marketplace.

### Legitimate access methods

Legitimate paths appear to be:

1. **Official seller API**
   - for merchants/refurbishers selling on Back Market
   - good if Scoutrr ever serves inventory owners rather than shoppers

2. **Back-office / merchant tooling**
   - also seller-oriented

3. **Manual listing entry**
   - relevant for Scoutrr’s current buyer-side use case

### What existing projects use

What I found:
- the official `api.backmarket.dev` docs
- third-party seller-management platforms documenting Back Market integration
- unofficial GitHub wrappers around Back Market merchant API behavior
- scraping vendors marketing Back Market product extraction

So the ecosystem here looks like:
- **official API for merchants**
- **scraping for buyer-side aggregation** if someone wants public-marketplace discovery data

### Legal / ToS risk

Because Back Market already offers an official seller API, the clean path is to use that where it fits.

For buyer-side scraping, risk is lower than Facebook/Craigslist in the sense that the site is easier to access technically, but it is still the wrong integration shape unless legal review says otherwise.

### Manual URL fallback

Good fallback:
- allow users to save a Back Market product/listing URL as a manual listing
- optionally parse title/price/image if the page is fetchable
- otherwise preserve the manual data entry workflow

### Recommendation

For Scoutrr:
- do **not** frame Back Market’s official API as a shopper discovery API
- if you ever want merchant/refurbisher integrations, Back Market is the strongest candidate of the three
- for current Scoutrr buyer-side watch use cases, use **manual listing/manual URL support** first

---

## Ranking for future Scoutrr integration work

If you ever revisit native integrations, my order would be:

1. **Back Market** — best official API quality, but wrong shape for current buyer-side discovery
2. **Swappa** — plausible partner path, electronics-focused, worth outreach
3. **Facebook Marketplace** — biggest audience, worst integration posture

## Practical recommendation for now

Short-term product move:
- keep using the new **manual listing** flow for Facebook Marketplace, Swappa, Back Market, Craigslist, and anything else
- if helpful later, add a **Paste listing URL** helper that tries best-effort metadata extraction

Most realistic next official-integration investigation:
- **Swappa partner/API clarification**
- **Back Market merchant API fit** only if Scoutrr ever pivots toward seller/refurbisher workflows
