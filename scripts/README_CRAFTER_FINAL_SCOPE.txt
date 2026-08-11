FF14 Crafter Macro Generator - Final calculation scope (v78)
Updated: 2026-08-11

1. Normal recipes
- Recipe profile is selected from RecipeLevelTable / verified overrides.
- Craftsmanship and Control are never hard-coded; base progress/quality are calculated from the current player inputs.
- If the entered recipe tuple cannot identify a safe profile, generation stops instead of guessing.

2. Cosmic Explorer normal
- B/C/D/A and A star1-star4 use the same Lv100 normal calculation formula:
  PD170 / PM90 / QD150 / QM75.
- Rank/star selectors are intentionally removed because they do not change this calculation profile.

3. Cosmic Explorer high difficulty
- Internal modifiers are not safely inferable from rank/star labels alone.
- Final supported exact recipe: A star1 high difficulty 7500 / 15000 / durability70.
- A star2+ and all other unverified high-difficulty tuples are rejected rather than guessed.

4. Search
- Maximum 30 actions.
- Primary objective: complete + max quality.
- Then minimum action count; at equal action count, minimum wait total.
- Beam Search can theoretically miss an existing route. This affects discovery completeness, not the arithmetic simulation of a returned route.

5. Verification files
- crafter-macro-empirical-data.json: machine measurements with player stats.
- crafter-macro-regression-cases.json: regression definitions.
- run-crafter-macro-regression.js: executable regression runner.
