# Design QA: beUI Conversation Header

## Comparison target

- Source visual truth: `/var/folders/76/8_ghw575777fq0mzflnl2kzh0000gn/T/TemporaryItems/NSIRD_screencaptureui_0nu5q4/Captura de pantalla 2026-09-17 a las 13.12.41.png`
- Implementation screenshot: `design-qa/header-unconfigured.png`
- Combined comparison evidence: `design-qa/header-comparison.png`
- Browser viewport: 1187 × 720 CSS px, Chromium, device scale factor 1.
- Source pixels: 1187 × 84 at 1x. The beUI preview adds 12 px of top canvas space and approximately 24 px of horizontal framing around its 56 px app header.
- Implementation pixels: 1187 × 56 at 1x. This is an element capture of the app-owned header only.
- State: authenticated project chat with no external provider credential configured and the sidebar collapsed.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the implementation uses the same 14 px medium title and 11 px muted subtitle hierarchy as the official beUI source. The provider explanation uses the same small muted UI scale and wraps intentionally to preserve the compact 56 px header.
- Spacing and layout rhythm: height, border, `px-4` horizontal padding, 10 px trigger-to-title gap, title stack, and right alignment match the official header composition. The source's outer preview canvas is documentation chrome and is not part of the app header.
- Colors and visual tokens: background, border, foreground, and muted foreground use the installed beUI semantic tokens. The amber provider CTA intentionally replaces the source's green connected badge because the captured product state has no configured external provider.
- Image quality and asset fidelity: the header has no raster assets. `PanelLeft` and `KeyRound` come from the project's existing icon library; no custom SVG, CSS drawing, or placeholder asset is used.
- Copy and content: title and project context are data-driven. The unconfigured message explains why external models are unavailable, and `Set up provider` opens the personal provider settings dialog. `Connected` is absent when only the deterministic demo provider is available.
- Interaction and accessibility: the sidebar trigger and provider CTA are keyboard operable, have accessible names and visible focus treatment, and the CTA opens the existing provider settings dialog. Axe reported no serious or critical WCAG 2 A/AA violations in the tested workspace and settings states.

## Full-view comparison evidence

`design-qa/header-comparison.png` places the supplied beUI source above the browser-rendered implementation at the same 1187 px width. The left control and title stack align after accounting for the source preview's 24 px outer frame. The implementation preserves the official composition while replacing an invalid connected state with the required recovery path.

## Focused region comparison

No additional crop was needed: both evidence files are already focused header captures, and all typography, icons, spacing, border, status copy, and CTA details are legible at original 1x density.

## Comparison history

1. Initial pass found two P2 fidelity issues: the implementation used `px-3` instead of the official `px-4`, and the recovery CTA used a bespoke native button rather than the installed beUI motion button.
2. The header was updated to the official `flex h-14 shrink-0 items-center justify-between border-b border-border px-4` composition, and the CTA now uses beUI `Button` with the existing semantic warning treatment.
3. The implementation was recaptured at 1187 × 720, combined with the source in `design-qa/header-comparison.png`, and re-reviewed. No actionable P0/P1/P2 differences remain.

## Primary interactions tested

- Open provider settings from the unconfigured header CTA.
- Save a synthetic personal provider credential and transition to `Provider ready`.
- Remove the credential and return to the unconfigured explanation and CTA.
- Confirm another authenticated user remains unconfigured.
- Operate account settings and logout by keyboard on desktop and mobile.

## Connected-provider-only model selector

- Source problem-state screenshot: `/var/folders/76/8_ghw575777fq0mzflnl2kzh0000gn/T/TemporaryItems/NSIRD_screencaptureui_wjQlvS/Captura de pantalla 2026-09-17 a las 13.30.20.png`
- Source pixels: 385 × 419 at 1x. The screenshot shows the previous Demo entry plus disabled OpenAI, Anthropic, and Google groups.
- Connected implementation crop: `design-qa/connected-provider-model-selector.png`, 304 × 138 at 1x.
- Empty-catalog implementation: `design-qa/no-provider-model-state.png`, 1187 × 720 at 1x.
- Combined comparison input: `design-qa/model-selector-comparison.png`, 798 × 435 at 1x.
- Browser viewport: 1187 × 720 CSS px, Chromium, device scale factor 1.

The connected implementation preserves the installed beUI selector typography, border, radius,
spacing, icon treatment, selected row, check mark, and motion language. Content now contains only the
OpenAI group after only OpenAI is configured. The Demo, Anthropic, and Google rows from the source
problem state are absent rather than shown disabled. With no configured provider, the trigger reads
`Connect a provider`, the composer is disabled, and the header provides the Settings CTA.

Required fidelity surfaces:

- Fonts and typography: unchanged from the beUI selector; provider label remains 10 px uppercase and
  model label/description retain their original hierarchy.
- Spacing and layout rhythm: the panel contracts naturally to one provider group instead of
  reserving empty or disabled rows.
- Colors and visual tokens: existing background, selected surface, border, foreground, and muted
  tokens are preserved. The accessible `Provider ready` foreground remains darker than the exact
  beUI sample because the sample color measured 3.31:1 in Axe.
- Image and icon fidelity: provider icons remain from the existing icon library; no new raster,
  custom SVG, CSS drawing, or placeholder asset was introduced.
- Copy and content: Demo and `Not configured` model entries are gone. Connected model descriptions
  remain provider-specific, while the empty state directs the user to provider settings.

Comparison history:

1. The source screenshot exposed Demo as selected and rendered all unconfigured providers as
   disabled options, contradicting the amended product requirement.
2. The catalog, API, selector, composer, and chat defaults were changed to support an empty catalog
   and connected providers only.
3. Browser evidence captured both the empty state and an OpenAI-only catalog. No actionable P0/P1/P2
   visual or interaction differences remain.

## Concrete multi-model selector correction

- Reported problem-state screenshot: `/var/folders/76/8_ghw575777fq0mzflnl2kzh0000gn/T/TemporaryItems/NSIRD_screencaptureui_MIbcbM/Captura de pantalla 2026-09-17 a las 13.59.51.png`
- Corrected browser crop: `design-qa/connected-provider-model-selector.png`, 304 × 241 at 1x.
- Side-by-side evidence: `design-qa/concrete-model-selector-comparison.png`, 709 × 241 at 1x.
- Browser viewport: 1187 × 720 CSS px, Chromium, device scale factor 1.

The reported state rendered one generic `OpenAI · GPT` family row. The corrected state renders three
concrete OpenAI rows—GPT-5.6, GPT-5.6 Terra, and GPT-5.6 Luna—with distinct capability summaries and
one selected default. The existing beUI selector component, provider heading, icons, selected surface,
check mark, spacing, typography, truncation behavior, border, and trigger motion remain unchanged.

No actionable P0, P1, or P2 differences remain. Playwright verifies exactly three options for the
single connected provider, absence of Demo/Anthropic/Google, keyboard-enabled selection, and no
serious or critical Axe violations in the covered workspace flow. The same three entries were also
confirmed in the user's running `localhost:3000` session after the development server restart.

## Follow-up polish

None required for this target.

final result: passed
