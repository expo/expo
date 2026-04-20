# Updating Expo Config (app.json / app.config.js)

This skill documents the process of adding new properties to the Expo config schema.

## Files to Update

When adding a new property to the Expo config, update these files in order:

### 1. JSON Schema (Universe)

> This step only works for Expo team members with access to the server repository.

**File:** `../universe/server/www/xdl-schemas/UNVERSIONED-schema.json` (depends on where the developer clones the `universe` repo)

Add the property to the corresponding definition (`IOS`, `Android`, etc.) with:

- `description`: Human-readable description
- `type`: JSON schema type
- `pattern`: Regex validation (if applicable)
- `meta.bareWorkflow`: Instructions for bare workflow users

```json
"propertyName": {
  "description": "Description of the property.",
  "type": "string",
  "pattern": "^\\d+\\.\\d+$",
  "meta": {
    "bareWorkflow": "Instructions for bare workflow"
  }
}
```

### 2. Update TypeScript Types

Generate the TypeScript types based on the JSON schema: `cd packages/@expo/config-types && pnpm generate --path ../../../../universe/server/www/xdl-schemas/UNVERSIONED-schema.json` in `packages/@expo/config-types`

### 3. Docs Schema

This file is **auto-generated** from the universe schema via the Expo API server. After the universe schema is deployed: `cd docs && pnpm run schema-sync unversioned`

### 3. Config Plugin (if the property needs to be applied during prebuild)

Create a new plugin module following existing patterns, generally in `packages/@expo/config-plugins/src`

Ensure the plugin is registered for prebuild in `packages/@expo/prebuild-config`

### 4. Tests

#### Config Plugin Tests

**File:** `packages/@expo/config-plugins/src/ios/__tests__/PropertyName-test.ts`

Test the getter function and plugin behavior:

```typescript
describe('PropertyName module', () => {
  describe(getPropertyName, () => {
    it('returns null if not set', () => {});
    it('returns the value when provided', () => {});
  });
});
```

#### Prebuild Config Tests

**File:** `packages/@expo/prebuild-config/src/plugins/__tests__/withDefaultPlugins-test.ts`

Add the new property to `getLargeConfig()` test fixture.

## Build & Verify

After making changes, run:

```bash
# Build config-types
cd packages/@expo/config-types && pnpm build

# Build and test config-plugins
cd packages/@expo/config-plugins && pnpm build && pnpm typecheck
pnpm test src/ios/__tests__/PropertyName-test.ts
# Build prebuild-config
cd packages/@expo/prebuild-config && pnpm build && pnpm typecheck
```

## Checklist

- [ ] JSON schema in universe (`UNVERSIONED-schema.json`)
- [ ] TypeScript types in `@expo/config-types`
- [ ] Docs schema (run `cd docs && yarn run schema-sync unversioned` after universe deploy, or manually update for local dev)
- [ ] Config plugin (if needed)
- [ ] Tests for plugin
