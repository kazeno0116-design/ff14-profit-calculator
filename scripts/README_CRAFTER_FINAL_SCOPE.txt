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

V84 audit additions:
- Trained Eye game-side legality (10-level gap / expert restriction) is enforced in act(), not only candidate generation.
- Final goal ties never use remaining CP or durability; identical action-count/wait ties are deterministic by action sequence.

V85: 実機マクロ安定性のため、経過観察・最終確認は wait.3。既知のバフ系 wait.2 は維持。

[V86 best-effort search hardening]
- Best-effort search no longer relies on a single oversized Beam width. It runs a small portfolio of balanced Beam widths and keeps the best completed candidate by: quality -> fewer actions -> shorter total wait.
- A dedicated balanced Beam lane preserves states where progress and quality advance together, preventing quality-only/progress-only branches from crowding out useful mixed routes.
- Pure tempo/combo-preparation actions are also checked through a safe ablation lane when enabled. Any route found with one such action disabled remains executable under the original larger enabled-skill set, so enabling that action cannot make the returned best-effort result worse in the checked lane.
- Best-effort output is pruned and re-simulated while preserving completion and the discovered quality, removing unnecessary actions such as redundant Observe chains when they provide no benefit.
- The reported Lv100 star4 case (Craftsmanship 5644 / Control 5507 / CP642 / 10040 / 21200 / durability70 / 50% initial quality) is retained only as a regression test. No player-stat-specific branch or recipe hardcode is present in production logic.
- Dedicated regression: scripts/run-crafter-macro-v87-best-effort-regression.js


V87 audit additions (2026-08-12):
- best-effort portfolio no longer returns immediately on the first exact route; all portfolio lanes are compared by max quality -> fewer actions -> shorter wait.
- each completed/exact portfolio candidate is pruned and re-simulated before cross-lane ranking.
- random state-transition fuzz audit: 12,000 crafts / ~182k transitions, state invariant failures 0.
- RecipeLevelTable cross-level resolver audit: 2,397 cases, coefficient mismatches 0; ambiguous cases remain safe-rejected.

V88 final audit additions:
- Correct Trained Eye durability metadata to 0.
- Groundwork half-efficiency applies only when current durability is below actual durability cost; equality uses full efficiency.
- Cosmic Steady Hand is Lv90, consumes a crafting step, and supports configurable 1-3 mission charges via cosmicSteadyUses.
- cosmicSteadyUses is included in candidate availability, execution cap, state identity/dominance through cosmicUses, UI persistence, and final summary.
- Exact/best-effort pruning now repeats to a fixed point; only the pre-applied Miracle Material action is protected from removal.
- Dominance grouping includes progress and durability so only comparable states are paired, preserving logic while avoiding pathological comparisons.
- Added exhaustive action-state audits covering all 28 normal actions over level/CP/durability/IQ/combo/buff boundaries, 6,561 buff combinations per action, two-action pairs, profile/fuzz audits, and final UI/charge integration checks.

V89 final objective / regression policy
- Primary objective: for any supported player stats and recipe level, first obtain a completed macro at maximum quality whenever such a route is found; among max-quality completed routes prefer fewer actions, then shorter total wait.
- Normal recipe profile resolution no longer requires the user-entered difficulty / max quality / durability tuple to exactly match a RecipeLevelTable base row. The visible recipe crafting level selects the current normal coefficients; the entered difficulty / quality / durability remain independent recipe targets.
- Exact-route search keeps the existing diversified first pass, then rechecks the found action depth with a wider balanced Beam (12000). The original verified route is retained if the wider verification times out or does not improve it.
- V89 profile audit: 78/78 passed.
- V89 exact-optimality audit: Lv10/20/30/40/50/60/70/80/90/100 were each run separately against exhaustive BFS; all 10 matched minimum action count and, at that count, minimum total wait.
- V88 full action-state Oracle was rerun after the V89 changes: 1,837,080 valid transitions / 14,355,473 checks / 0 failures.
- Best-effort regression was rerun: the reported Lv100 star-4 Observe-on/off inversion does not recur; both lanes reach the same 20,378 quality / 23 actions on that known non-max-quality case.
- Existing empirical, Cosmic, mastery, durability-zero, Groundwork, Final Appraisal, Trained Eye/Perfection and macro-line regressions all pass.
- Exhaustive optimality is computationally practical only for bounded audit cases; large 20-30-action searches remain Beam-based, so mathematical global optimality for every possible input is not claimed. Final output is always re-simulated before display.

V90 performance pass:
- Keeps V89 Beam widths, search depths, candidate semantics, and public objective unchanged.
- Caches recipe base progress/quality per immutable search stats object.
- Caches static level/skill-eligible candidate lists per search stats object; dynamic state conditions remain evaluated every state.
- Carries cumulative macro wait on search states instead of repeatedly reducing the full action log.
- Memoizes immutable state keys used repeatedly during Beam selection/deduplication.
- A proposed ranking-sort rewrite was benchmarked slower and was rejected.
- V90 must not rank below V89 on exact quality/completion/actions/wait comparisons.
