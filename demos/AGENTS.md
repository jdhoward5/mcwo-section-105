# MCWO Section 105 Demo Lab

## Purpose

This directory contains small, interactive teaching demos for the concepts in
MCWO Section 105. The site should help learners observe a concept, manipulate
its inputs, and connect what they see to the precise definitions in the parent
section notes.

## Architecture

- `server.py` is a dependency-free Python development server. It serves `site/`
  and owns any small JSON endpoints needed by a demo.
- Files such as `105_2.py` contain testable Python transformations for a module.
- `site/app.js` is the demo catalog and hash-based router.
- `site/demos/<section>.js` exports an async `mount(root)` function. It must
  return a cleanup function that removes timers, animation frames, or listeners
  that outlive the rendered DOM.
- `site/styles.css` contains the shared visual system. Extend existing tokens and
  components before introducing module-specific styles.

Do not add a frontend framework, package manager, build step, or Python package
unless the complexity of a specific demo clearly requires one. Prefer the
browser platform and Python standard library.

## Running the Lab

From this directory:

```bash
source .venv/bin/activate
python server.py
```

Open `http://127.0.0.1:8000`. A different port can be selected with
`python server.py --port <port>`.

## Demo Design Conventions

- Keep explanations aligned with `../Information Fundamentals Overview.md` and
  the supporting Section 105 notes. Do not simplify a concept into something
  technically false.
- Make each demo answer one clear learning question.
- Put explanatory text and controls in semantic HTML. Use canvas or SVG for
  relationships, motion, and spatial models—not as the only source of text.
- Let the learner change an input and immediately observe the consequences.
- Label representations and units explicitly: characters are not bytes, and
  payload size is not total protocol size.
- Use deterministic examples where possible so behavior is easy to verify.
- Support keyboard navigation, narrow screens, and reduced-motion preferences.
- Do not depend on third-party CDNs; the lab should work offline.

## Adding a Demo

1. Add the module to the catalog in `site/app.js`.
2. Create `site/demos/<section>.js` with a `mount(root)` export.
3. Add a Python module or API route only if browser-side code is insufficient or
   Python itself is part of what the demo teaches.
4. Add focused tests for Python transformations and exercise every interactive
   state in a browser.
5. Mark the catalog entry `ready` only after desktop and narrow-screen checks.

## Verification

Before considering a change complete:

- Run `python -m compileall server.py 105_*.py`.
- Exercise relevant transformation modules directly from the command line.
- Start the local server and verify `/api/health` plus any changed API route.
- Load the site in a browser, check the console, and interact with every changed
  control at desktop and mobile widths.
