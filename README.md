# Better Divider

Better Divider is an SPFx 1.21.1 web part that behaves like the default SharePoint divider while exposing additional author controls.

## Properties

- Color
- Line style: solid, dashed, or dotted
- Thickness
- Rounded ends
- Width
- Alignment
- Vertical spacing
- Custom CSS with syntax highlighting

Custom CSS is scoped to the divider surface. Target `:host`, `.better-divider`, or `.better-divider__line`.

## Commands

```sh
npm run build -- --filter @spfx-kit/better-divider-spfx
npm run ship -- --filter @spfx-kit/better-divider-spfx
npm run validate:spfx -- --app apps/better-divider-spfx
```
