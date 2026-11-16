# MCWO Section 105: Information Fundamentals

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Instructors teaching MCWO Section 105 and learners using the material in instructor-led or self-guided settings.

## Product Purpose

The Section 105 notes and Information Lab form one teaching resource for information fundamentals. The notes supply definitions and explanations; the lab lets learners manipulate inputs, observe consequences, and connect those observations to the concepts in the notes.

Success means learners can explain the covered concepts accurately and relate the definitions to observable examples. Formal assessment and progress-tracking requirements are undecided.

## Positioning

The resource pairs Section 105's numbered learning topics with interactive demonstrations. Its organizing mechanism is the direct connection between the reference material and experiments learners can control.

## Operating Context

- Use supports both instructor-led demonstrations and self-guided exploration.
- The notes cover topics 105.1–105.28. The lab catalog currently contains 27 modules, covering 105.2–105.28.
- The learning interaction is to choose a topic, consult its explanation, change an input, and observe what changes and what remains constant.
- Notes are Markdown documents with section references and source links. The lab runs locally in a browser, served by `demos/server.py`.
- Run the lab from `demos/` with `.venv/bin/python server.py`, then open `http://127.0.0.1:8000`. The server accepts `--port` for an alternate port.

## Capabilities and Constraints

Existing implementation and project requirements are documented in `demos/AGENTS.md`:

- Preserve the plain HTML, CSS, and JavaScript frontend and Python standard-library server. Add a framework, package manager, build step, or Python dependency only when a specific demo's complexity clearly requires it.
- The lab must work offline and must not depend on third-party CDNs. The reference notes contain external source links; offline operation does not imply those external sources are bundled.
- Keep explanations and demonstrations aligned with the Section 105 notes. Simplification must remain technically accurate.
- Give each demo one clear learning question and immediate feedback when inputs change.
- Label representations and units explicitly, including distinctions such as characters versus bytes and payload size versus total protocol size.
- Prefer deterministic examples that can be verified.
- Use browser-side logic when sufficient; Python transformations and small JSON endpoints support modules that need them.
- Preserve section numbering and correspondence between notes, catalog entries, and demonstrations.

The intended hosting or distribution model beyond the existing local server is undecided. Learners' prerequisite knowledge and any formal assessment requirements have not been specified.

## Brand Commitments

Use the existing names “MCWO Section 105,” “Information Fundamentals,” and “Information Lab” for their respective subject and lab contexts. Explanations should remain clear and technically precise.

The default theme is **Paper & Ink**: warm ivory navigation and reading surfaces, dark green text and actions, and light experiment panels, insets, controls, and diagrams. Preserve the green, amber, blue, violet, and red teaching categories using darker equivalents with contrast on paper. Diagram connections must remain distinguishable from their backgrounds. The shared theme lives in `demos/site/paper-ink.css`.

### Interface Terminology

- **Topic:** a numbered Section 105 subject, including the notes-only topic 105.1.
- **Experiment:** the interactive demonstration for a topic.
- **Notes:** the corresponding reference text, available while an experiment remains open.
- **Step:** one position in a guided experiment. Use “Previous step,” “Next step,” “Play steps,” and “Pause steps” consistently for these controls; retain domain terms within the explanations.
- **Reload:** retry loading notes or an experiment. “Read notes” opens the reader; “Close notes” closes it. On narrow screens, “Return to experiment” restores the experiment view.

### Dashboard Disclosure

The current topic's group opens automatically; other topic groups can be expanded as needed. Search expands every matching group. The notes-width preference remains available under “Reading width.” Repeated catalog totals, the header's local-availability label, and the sidebar's generic tip were removed to keep attention on topic selection and experimentation; no topics, notes, or experiment controls were removed.

## Evidence on Hand

- `Information Fundamentals Overview.md`: the main explanations and learning topics for Sections 105.1–105.28.
- `105.1.md`: foundational definitions with source attributions and links.
- `demos/site/app.js`: the interactive module catalog and hash-based routing.
- `demos/site/demos/`: the existing browser demonstrations.
- `demos/105_*.py` and `demos/test_105_*.py`: Python transformations and their existing focused tests.
- `demos/AGENTS.md`: implementation, teaching, accessibility, and verification requirements for the lab.

No learning-outcome measurements, accreditation claims, or testimonials have been supplied. Do not invent them.

## Product Principles

1. Connect each experiment to the precise concept it teaches.
2. Make cause and effect observable through learner-controlled inputs.
3. Preserve technical accuracy across both notes and demonstrations.
4. Support instructor-led and self-guided learning with the same core material.
5. Keep the lab practical to run locally and without internet dependencies.

## Accessibility & Inclusion

The lab's existing requirements include keyboard navigation, narrow-screen support, and respect for reduced-motion preferences. Put explanations and controls in semantic HTML; canvas and SVG may illustrate relationships, motion, and spatial models, but must not be the only source of text. No additional product-specific accessibility standard has been specified.
