## 2026-03-25 - Sticky Header z-index Interference with Skip Links
**Learning:** The sticky header in this app has a `z-index: 1000`. Accessibility overlays, such as skip-to-content links that animate into view from the top, can be hidden underneath this header unless given an explicit, higher z-index, which prevents them from being visible to sighted keyboard users.
**Action:** Always ensure that accessibility overlays and hidden-until-focused elements (like skip links) have a `z-index` of 1001 or higher so they appear above the sticky header.
