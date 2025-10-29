# ISO Drawing Standards (summary)

This page summarises the ISO standards and conventions the project aims to follow for 2D outputs. It is not a replacement for the standards themselves but a pragmatic guide for automated drawing generation.

Key standards to follow (references)
- ISO 128: General principles of presentation and line conventions
- ISO 129: Dimensioning rules
- ISO 5456: Projection methods (first-angle and third-angle; ISO commonly uses first-angle)
- ISO 7200: Title block contents and data fields

Practical decisions for Tower19
- Projection: Use first-angle projection by default when arranging views (Front, Top above, Right to the right).
- Line types:
  - Visible outlines: solid, thicker weight
  - Hidden lines: dashed, standard dash spacing per scale
  - Centre lines: alternating long-short pattern
- Dimensioning:
  - Units: millimetres (mm). Display units once in the title block.
  - Text size: choose a default height at 1:1 (e.g., 3.5 mm) and scale text for other drawing scales.
  - Arrowheads / ticks: consistent style; allow a simple arrowhead for clarity.
- Title block: Include part name, seed ID, difficulty, units, scale, date, and author (optional). Use a compact layout inspired by ISO 7200.

Section views
- Use section hatching (45° lines) at a density appropriate to the scale. Label sections (A-A, B-B) and indicate cutting plane on primary view.

Notes on projection: ensure orthographic projection is used for dimension accuracy (no perspective in 2D outputs).
