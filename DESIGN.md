# NoNote Landing Design System

## Direction

Quiet Product Confidence: calm, trustworthy and clear, with restrained moments of technical wonder. Real product evidence carries the page; interaction explains how NoNote works.

## Color

Colors are defined as semantic OKLCH tokens in `src/assets/styles.css`.

- Canvas: pure white.
- Surface: a very low-chroma green-gray.
- Ink: near-black with a quiet green bias.
- Brand: deep NoNote green.
- Accent: muted amber used only for flow signals.
- Night: neutral near-black for the Local-First section.

Body text must reach WCAG AA. Saturated brand fills use white text.

## Typography

Use the native UI stack for speed, Chinese coverage and platform familiarity:

```css
-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC",
"Microsoft YaHei UI", "Segoe UI", sans-serif
```

Display type uses the same family with stronger scale, weight and optical spacing. Body copy is at least 16px and capped near 70 characters. Display tracking never goes below `-0.04em`.

## Layout

- Global maximum content width: 1180px.
- Mobile gutters: 14–20px.
- Desktop sections use deliberate changes in density rather than repeated cards.
- 900px is the primary structural breakpoint; 620px handles compact mobile composition.
- Product imagery may slightly exceed the text container on mobile, but never the viewport.

## Components

- Buttons use compact 8–9px radii and visible press feedback.
- Cards are reserved for download choices and bounded interactive surfaces.
- Product capabilities use ruled editorial rows, not a repeated icon-card grid.
- The Local-First section is a dark narrative interruption with a code-native SVG flow.
- Product screenshots use a restrained window frame and no fake browser chrome.

## Motion

- Ease: `cubic-bezier(.16, 1, .3, 1)`.
- Fast feedback: 180ms.
- State or staged transitions: 420ms.
- Hero runs one short three-step demonstration and then stops.
- Continuous motion is limited to low-attention orbit/path effects.
- Reduced-motion disables automatic and spatial motion.

## Accessibility

- WCAG 2.2 AA minimum.
- 44px interaction targets.
- Visible focus rings.
- Full keyboard support.
- Content and downloads remain available without JavaScript.
- Interactive demonstrations duplicate information in readable text.
