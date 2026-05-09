# Ready-to-post GitHub issues

## 1) Smart listing scoring / ranking

**Title:** Smart listing scoring and ranking for watch results

**Labels:** enhancement

**Body:**

### Summary
Add a smarter listing scoring/ranking layer so Scoutrr can recommend the best listing using more than just lowest total cost.

### Why
Right now top-runner selection is mostly cost-first. That works, but it misses context like condition quality, suspicious titles, seller quality, and how well a listing matches the actual intent of the watch.

### Proposed approach
Create a dedicated `scoring.py` module that assigns weighted scores to listings using signals like:
- total cost
- condition quality
- title match quality
- category relevance
- likely accessory/parts noise
- suspicious resale patterns
- seller quality signals once available
- optional manual boosts/penalties later

### Expected outcome
- more useful top-runner selection
- fewer obviously bad “cheap but wrong” winners
- foundation for future trusted-seller and advanced ranking work

### Scope
- add scoring module
- rank listings by score
- preserve raw cost display, but separate “best score” from “cheapest price”
- keep weights simple/configurable to start

### Notes
This should be implemented in a way that stays easy to tune without rewriting the ranking pipeline.

---

## 2) Trusted seller reputation display

**Title:** Show trusted seller reputation details on listing cards

**Labels:** enhancement

**Body:**

### Summary
Show seller reputation details on listing cards so users can judge seller quality without opening eBay.

### Why
A cheap listing is not always the best listing. Seller reputation matters, especially for used/refurbished tech where return risk and listing accuracy vary a lot.

### Desired UI
Display seller trust info directly on listing cards when available:
- seller username
- seller feedback score / count
- positive feedback percentage if available
- Top Rated Seller badge if available

### Data source
Pull seller info from the eBay API response if available, or from any additional endpoint needed during listing enrichment.

### Expected outcome
- faster buyer judgment
- less tab-hopping
- better ranking inputs for future scoring logic

### Scope
- fetch/store seller trust metadata
- expose it in backend listing payloads
- render it cleanly on listing cards
- keep missing-data states graceful

### Notes
This also feeds directly into future smart scoring/ranking work.

---

## 3) Mobile layout pass

**Title:** Mobile layout pass for Scoutrr UI

**Labels:** enhancement

**Body:**

### Summary
Tighten the current desktop-first UI so it stops breaking down on phone screens, without doing a full responsive redesign.

### Why
The app is usable on desktop, but several screens feel cramped or awkward on mobile. A compact layout pass would make it much more practical for quick checks and watch refreshes on a phone.

### Areas to improve
- watch creation form spacing and wrapping
- watch list row density
- watch detail header controls
- listing card button stacking
- sidebar/nav behavior on narrow screens
- dashboard listing grid collapse

### Goal
Make mobile feel intentionally compact, not just “desktop squished smaller.”

### Scope
- adjust breakpoints
- reduce spacing where needed
- improve stacking/order of controls
- keep the current design language
- avoid a full UI rewrite

### Notes
This should be a pragmatic polish pass, not a large redesign project.
