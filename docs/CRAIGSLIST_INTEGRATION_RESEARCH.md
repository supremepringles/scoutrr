# Craigslist integration research

## Bottom line

Craigslist is a bad candidate for a normal automated marketplace integration.

There is **no public official search/listings API** for buyer-side ingestion that Scoutrr could safely build on.
The official things Craigslist exposes are narrow and do **not** solve listing search:

- **Reference Web Services** for lookup data like areas and categories
- **Bulk Posting Interface** for approved high-volume posters in specific paid categories

For buyer-side deal hunting, most existing projects fall into one of these buckets:

1. HTML scraping
2. RSS/feed parsing where available
3. Paid unofficial scraper/API vendors wrapping scraping
4. Manual URL save / manual listing entry

## What is officially available

### 1) Craigslist Reference Web Services

Craigslist has an official reference service documented at:
- `https://www.craigslist.org/about/reference`

What it provides:
- area metadata
- sub-area metadata
- category metadata

What it does **not** provide:
- marketplace listing search
- listing detail lookup API
- official deal-monitoring/search endpoint

So this is useful only as helper metadata if we ever support Craigslist manually.

### 2) Craigslist Bulk Posting Interface

Craigslist also documents a bulk posting interface at:
- `https://www.craigslist.org/about/bulk_posting_interface`

Important limitation from their own docs:
- it is for **submitting posts**, not buyer-side search
- access is granted case-by-case
- it is limited to specific high-volume/paid posting use cases

This does not help Scoutrr pull deals from Craigslist.

## Third-party APIs

There are multiple vendors advertising a “Craigslist API”, but they are effectively **unofficial scraping products**, not sanctioned listing APIs.
Examples I found:
- Apify Craigslist API
- DataPilotAPI Craigslist API
- Oxylabs Craigslist scraper tooling

Practical read on these:
- fastest path if someone insists on automated ingestion
- still dependent on scraping surviving Craigslist changes/blocks
- adds vendor cost and lock-in
- legal/risk posture is worse than using a first-party API

## What existing projects actually do

In practice, Craigslist projects usually use:
- direct HTML scraping of search results and item pages
- RSS/feed-style ingestion where available
- rotating proxies / anti-bot infrastructure
- paid scraping APIs

That is the real ecosystem here: **scraping, not stable official integration**.

## Legal / ToS risk

Craigslist’s Terms of Use are hostile to scraping and automation.
From `https://www.craigslist.org/about/terms.of.use`:
- they prohibit using software/services that interact with Craigslist for searching unless separately licensed
- they prohibit copying/collecting content via robots, spiders, scripts, scrapers, crawlers, or manual equivalents
- they define liquidated-damages clauses for certain violations
- they explicitly mention page-volume limits and anti-bypass language

This is much riskier than integrating with something like eBay’s official APIs.

## Technical risk

Even aside from ToS risk, Craigslist blocks automated access aggressively.
A direct fetch attempt against a Craigslist search RSS URL returned **403 blocked** during this research.
That is a strong sign that production ingestion would need anti-bot workarounds.

## Recommended product options

### Option A — manual-only support

Safest option.

Suggested UX:
- user pastes a Craigslist listing URL
- Scoutrr stores it as a manual listing attached to a watch
- optional helper parser tries to extract title/price/image if fetch succeeds
- if parsing fails, user can still fill fields manually

Pros:
- lowest legal and engineering risk
- aligns with the new manual-listing flow already in Scoutrr
- still gives users a way to track Craigslist finds inside a build/watch

Cons:
- no automatic search polling

### Option B — semi-manual RSS/import helper

Only worth considering if we accept fragility.

Possible shape:
- user supplies a Craigslist search URL or RSS URL
- Scoutrr attempts periodic import
- importer is best-effort and may break or get blocked

Pros:
- lighter than full scraper build

Cons:
- still sits in scraping-risk territory
- likely brittle
- unclear long-term reliability

### Option C — third-party scraper vendor

Fastest path to “automated Craigslist”, but I would treat it as a commercial/risk decision, not a normal feature.

Pros:
- quickest automation path
- less in-house anti-bot work

Cons:
- unofficial
- recurring cost
- breakage/vendor dependency
- same underlying ToS concerns

## Recommendation for Scoutrr

Recommended path:
1. **Do not build native Craigslist scraping into core Scoutrr right now**
2. Support **manual listing add** and possibly **manual Craigslist URL attach**
3. If demand is real, consider a future **experimental importer** behind a clearly labeled unstable/risky flag
4. Only evaluate third-party scraper vendors if Craigslist becomes a major product requirement

## Practical implementation note if we revisit later

If Scoutrr ever touches Craigslist again, the safest first increment is:
- add a “Paste Craigslist URL” helper
- try extracting title/price/image opportunistically
- fall back to manual fields
- avoid claims of official integration
