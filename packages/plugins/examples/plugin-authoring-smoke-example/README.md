# Plugin Authoring Smoke Example

A Papertape plugin

## Development

```bash
pnpm install
pnpm dev            # watch builds
pnpm dev:ui         # local dev server with hot-reload events
pnpm test
```

## Install Into Papertape

```bash
pnpm papertape plugin install ./
```

## Build Options

- `pnpm build` uses esbuild presets from `@papertape/plugin-sdk/bundlers`.
- `pnpm build:rollup` uses rollup presets from the same SDK.
