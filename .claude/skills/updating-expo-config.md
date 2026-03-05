# Updating Expo Config (app.json / app.config.js)

This skill documents the process of adding new properties to the Expo config schema.

## Files to Update

When adding a new property to the Expo config, update these files in order:

### 1. TypeScript Types

**File:** `packages/@expo/config-types/src/ExpoConfig.ts`

Add the new property to the appropriate interface (`ExpoConfig`, `IOS`, `Android`, `Web`, etc.) with JSDoc comments.

```typescript
/**
 * Description of the property.
 */
propertyName?: string;
```

### 2. JSON Schema (Universe)

> This step only works for Expo team members with access to the server repository.

**File:** `../universe/server/www/xdl-schemas/UNVERSIONED-schema.json`

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

### 3. Docs Schema

**File:** `docs/public/static/schemas/unversioned/app-config-schema.json`

This file is **auto-generated** from the universe schema via the Expo API server. After the universe schema is deployed:

```bash
cd docs && yarn run schema-sync unversioned
```

This fetches the schema from `exp.host/--/api/v2/project/configuration/schema/UNVERSIONED` and writes it locally.

**For local development** (before the universe schema is deployed), you can manually add the property definition to match what you added in step 2. The format is a flattened JSON without `$ref` references.

### 4. Config Plugin (if the property needs to be applied during prebuild)

**File:** `packages/@expo/config-plugins/src/ios/<PropertyName>.ts` (or android/)

Create a new plugin module following existing patterns:

```typescript
import type { ExpoConfig } from '@expo/config-types';
import type { ConfigPlugin } from '../Plugin.types';

export const withPropertyName: ConfigPlugin = (config) => {
  // Implementation
  return config;
};

export function getPropertyName(config: Pick<ExpoConfig, 'ios'>): string | null {
  return config.ios?.propertyName ?? null;
}
```

### 5. Export the Plugin

**File:** `packages/@expo/config-plugins/src/ios/index.ts` (or android/)

```typescript
import * as PropertyName from './PropertyName';
// ...
export {
  // ...
  PropertyName,
};
```

### 6. Register in Default Plugins

**File:** `packages/@expo/prebuild-config/src/plugins/withDefaultPlugins.ts`

Add to `withIosExpoPlugins` or `withAndroidExpoPlugins`:

```typescript
IOSConfig.PropertyName.withPropertyName,
```

### 7. Tests

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
cd packages/@expo/config-types && yarn build

# Build and test config-plugins
cd packages/@expo/config-plugins && yarn build && yarn typecheck
yarn test src/ios/__tests__/PropertyName-test.ts

# Build prebuild-config
cd packages/@expo/prebuild-config && yarn build && yarn typecheck
```

## Common Patterns

### iOS Build Settings (Xcode project)

Use `withXcodeProject` and iterate through `getNativeTargets()`:

```typescript
import { withXcodeProject } from '../plugins/ios-plugins';
import { getNativeTargets } from './Target';
import { getBuildConfigurationsForListId } from './utils/Xcodeproj';

export const withProperty: ConfigPlugin = (config) => {
  return withXcodeProject(config, (config) => {
    const nativeTargets = getNativeTargets(config.modResults);
    nativeTargets.forEach(([, nativeTarget]) => {
      getBuildConfigurationsForListId(
        config.modResults,
        nativeTarget.buildConfigurationList
      ).forEach(([, buildConfig]) => {
        buildConfig.buildSettings.SETTING_NAME = value;
      });
    });
    return config;
  });
};
```

### Podfile Properties

Use `createBuildPodfilePropsConfigPlugin`:

```typescript
import { createBuildPodfilePropsConfigPlugin } from './BuildProperties';

export const withPropertyPodfileProps = createBuildPodfilePropsConfigPlugin<ExpoConfig>(
  [
    {
      propName: 'property.name',
      propValueGetter: (config) => config.ios?.propertyName ?? null,
    },
  ],
  'withPropertyPodfileProps'
);
```

### Info.plist Properties

Use `createInfoPlistPluginWithPropertyGuard`:

```typescript
import { createInfoPlistPluginWithPropertyGuard } from './utils/withInfoPlist';

export const withProperty = createInfoPlistPluginWithPropertyGuard(
  setProperty,
  {
    infoPlistProperty: 'CFBundlePropertyName',
    expoConfigProperty: 'ios.propertyName',
  },
  'withProperty'
);
```

## Checklist

- [ ] TypeScript types in `@expo/config-types`
- [ ] JSON schema in universe (`UNVERSIONED-schema.json`)
- [ ] Docs schema (run `cd docs && yarn run schema-sync unversioned` after universe deploy, or manually update for local dev)
- [ ] Config plugin (if needed)
- [ ] Export plugin from index
- [ ] Register in default plugins (if needed)
- [ ] Unit tests for plugin
- [ ] Update prebuild-config test fixture
- [ ] Build and typecheck all packages
- [ ] Run tests
