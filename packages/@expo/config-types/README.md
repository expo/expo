<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/config-types</code>
</h1>

<p align="center">Types for the Expo config object <code>app.config.ts</code>.</p>

<p align="center">
  <img src="https://flat.badgen.net/packagephobia/install/@expo/config-types">

  <a href="https://www.npmjs.com/package/@expo/config-types">
    <img src="https://flat.badgen.net/npm/dw/@expo/config-types" target="_blank" />
  </a>
</p>

<!-- Body -->

## Usage

```ts
import { ExpoConfig } from '@expo/config-types';

export default (): ExpoConfig => {
  return {
    name: 'My App',
    slug: 'my-app',
  };
};
```

## Contributing

This package is 100% generated using the versioned JSON schemas from the Expo server.

- `pnpm generate` - uses the major version from the `package.json`.
- `pnpm generate --path ../../../../universe/server/www/xdl-schemas/UNVERSIONED-schema.json` - uses the latest version from your local directory.
- `pnpm generate 39` - uses the given version.
- `pnpm generate unversioned` - uses the latest version.
