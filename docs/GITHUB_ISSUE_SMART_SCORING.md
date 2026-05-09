Title: Smart listing scoring and ranking per watch
Labels: enhancement, good first issue

Problem: even with negative keyword filtering, eBay returns listings in its own order which doesn't reflect value or relevance to the user's intent

Goal: score incoming listings before displaying them so the most relevant results surface first

Suggested approach: build a scoring function in backend/scoring.py that takes a listing and a watch and returns a score int

Scoring signals to consider: title contains the exact model number = high score, title contains accessory/part keywords = penalty, sold count or watchers if available = boost, listing age (newer = higher), price within the watch's min/max range = boost, price at or near top runner = note

The function should be pluggable - easy to add new signals without rewriting existing ones

Listings should be sorted by score descending before being stored or returned

This is a great standalone contribution - the rest of the stack doesn't need to change, just implement the function and wire it into the scraper pipeline
