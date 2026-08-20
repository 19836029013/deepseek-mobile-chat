# Design QA

source visual truth: `design/ui-reference.png` (generated UI mock, nominal 390 × 844; source raster 853 × 1844)
implementation screenshot: `design/implementation-conversation.png` (mobile app screen, 393 × 852 CSS px, deviceScaleFactor 1)
Android reference capture: `design/implementation-screen.png` (Pixel 10 runtime screen, 427 × 952 CSS px)
comparison input: `design/qa-conversation-comparison.png`
state: conversation with user message, assistant answer, thinking controls, composer, and bottom navigation visible

## Findings

- No actionable P0/P1/P2 visual findings remain.
- P3: The runtime contributes platform status-bar/camera/home-navigation chrome around the app screen. This is intentional template-owned Android/iOS device chrome and is not part of the app-owned visual target.
- P3: The empty first-run state omits the mock's sample conversation. This is intentional: the app does not ship with prompts, constraints, or prefilled messages; a real conversation appears after the user sends a message.

## Required fidelity surfaces

- Fonts and typography: system sans-serif and the mock's compact hierarchy are used; headings, body copy, control labels, and composer text preserve the visual scale and weight relationships.
- Spacing and layout rhythm: top header, centered new-chat action, scrollable conversation, two-column thinking controls, composer, and bottom tabs follow the mock's vertical rhythm. The composer is positioned from the runtime keyboard inset rather than pinned below the keyboard.
- Colors and visual tokens: warm white, charcoal text, pale green user surfaces, emerald accent, thin cool-gray borders, and restrained shadows are mapped in `src/prototype.css`.
- Image quality and asset fidelity: the source contains no app-owned raster imagery. Controls use the installed Radix icon library; device chrome remains the protected runtime asset.
- Copy and content: Chinese labels follow the selected visual direction. No hidden system prompt or message constraint is inserted into API requests.

## Interaction evidence

- `npm run check:runtime`: passed.
- `npm run build`: passed; Sites output generated.
- `npm run test:runtime`: 8 passed.
- Playwright interaction check: focusing the composer reported `keyboard=true` and `composerBottom=316px`; sending without a saved API key opened the settings sheet.
- New chat, history sheet, model selection, thinking depth, deep-thinking toggle, settings sheet, API key storage, message persistence, and copy-answer controls are wired.

## Comparison history

1. Initial empty-state capture: intentional state difference identified because the user explicitly requested no built-in prompts or constraints.
2. Conversation-state capture: compared source and implementation side by side at normalized 393 × 852 content size; no P0/P1/P2 issues found.
3. Final code fix: removed duplicate user-message append during success/error handling, rebuilt, and reran all runtime tests.

## Final result

passed
