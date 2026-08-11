FF14 Crafter Macro Generator - Final calculation scope (v83)
Updated: 2026-08-12

1. Normal recipes
- Recipe profile is selected from RecipeLevelTable / verified overrides.
- UI exposes Lv51-Lv99 individually; Lv50 and below remain resolved from the entered recipe tuple.
- Player-level Mastery traits are applied separately from recipe coefficients: Basic Synthesis Lv31, Rapid Synthesis Lv63, Careful Synthesis Lv82, Groundwork Lv86, Delicate Synthesis Lv94.
- Craftsmanship and Control are never hard-coded; base progress/quality are calculated from the current player inputs.
- If the entered recipe tuple cannot identify a safe profile, generation stops instead of guessing.

2. Cosmic Explorer normal
- B/C/D/A and A star1-star4 use the same Lv100 normal calculation formula:
  PD170 / PM90 / QD150 / QM75.
- Rank/star selectors are intentionally removed because they do not change this calculation profile.

3. Cosmic Explorer high difficulty
- The dedicated high-difficulty selector means A star1 high difficulty.
- A star1 uses the Lv100 normal formula PD170 / PM90 / QD150 / QM75 for all recipe tuples entered under this selector.
- Machine anchor: 7500 / 15000 / durability70 at Craftsmanship5778 / Control5517 -> Basic Synthesis368 / Basic Touch302.
- Published A-1 example 9900 / 20300 / durability80 is included in regression coverage.
- A star2+ remains outside supported scope because machine measurements show mixed internal profiles; do not enter those recipes using the A star1 selector.

4. Search
- Maximum 30 actions.
- Final Appraisal is offered only when quality is still incomplete and a currently usable next Synthesis action could finish the craft.
- Groundwork half-efficiency checks share the same actual durability-cost calculation in simulation, Final Appraisal lookahead, and buff-order optimization.
- Primary objective: complete + max quality.
- Then minimum action count; at equal action count, minimum wait total.
- Beam Search can theoretically miss an existing route. This affects discovery completeness, not the arithmetic simulation of a returned route.

5. Verification files
- crafter-macro-empirical-data.json: machine measurements with player stats.
- crafter-macro-regression-cases.json: regression definitions.
- run-crafter-macro-regression.js: executable regression runner.


V83 state-rule corrections:
- Inner Quiet is active only for crafter Lv11 and above. Lv10 and below keep IQ at 0.
- Best-effort (max-quality-not-reached) ranking is quality first, then fewer actions, then shorter total wait. Remaining CP/durability are not ranking criteria.
- Cosmic Steady Hand is a normal crafting step: existing timed buffs tick once, Manipulation may restore durability, step increments by 1, then the fresh Steady Hand effect is applied at 3 turns.
- These are action/level rules. No player-stat-specific exceptions are used. Craftsmanship, Control and CP are treated as variable user inputs.
- The real-machine 5778/5514/CP633 case is retained only as a regression fixture, never as runtime branching logic.
