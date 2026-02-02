# Testing Expo CLI

## Test Types

| Type | Location | Command | Description |
|------|----------|---------|-------------|
| Unit | `src/**/__tests__/` | `yarn test` | Fast, isolated tests with mocked dependencies |
| E2E CLI | `e2e/__tests__/` | `yarn test:e2e` | Full CLI command tests in real projects |
| Playwright | `e2e/playwright/` | `yarn test:playwright` | Browser-based Metro web/server tests |
| Router E2E | `apps/router-e2e/__e2e__/` | See router-e2e section | Expo Router integration tests |

## Unit Tests

Unit tests live alongside source files in `__tests__` directories. They use Jest with extensive mocking.

### Global Mocks

The `jest.setup.ts` file automatically mocks common dependencies for all unit tests:

```ts
// jest.setup.ts - these are mocked globally
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('node:fs');
jest.mock('node:fs/promises');
jest.mock('child_process');
jest.mock('@expo/spawn-async');
jest.mock('@expo/package-manager');
jest.mock('resolve-from');
jest.mock('ora');
// ... and more
```

### Mock Directories (`__mocks__`)

Mock implementations live in `__mocks__` directories. Jest automatically uses these when a module is mocked.

#### Root Mocks (`/__mocks__/`)

Global mocks for npm packages and Node.js built-ins:

| Mock | Description |
|------|-------------|
| `fs.ts`, `fs/promises.ts` | Uses `memfs` for in-memory filesystem |
| `os.ts` | Stubs `homedir()` → `/home`, `tmpdir()` → `/tmp` |
| `child_process.ts` | Empty mock for process spawning |
| `resolve-from.ts` | Resolves from memfs paths, falls back to real resolver |
| `ora.ts` | No-op spinner |
| `@expo/spawn-async.ts` | Returns empty successful result |
| `@expo/package-manager.ts` | Mock package manager |
| `@expo/image-utils.ts` | Mock image processing |

#### Source Mocks (`/src/**/__mocks__/`)

Mocks for internal modules, colocated with source:

| Location | Mocks |
|----------|-------|
| `src/__mocks__/` | `log.ts` - silences console output |
| `src/utils/__mocks__/` | `createTempPath.ts`, `downloadExpoGoAsync.ts`, `exit.ts`, `port.ts` |
| `src/start/server/__mocks__/` | `AsyncNgrok.ts`, `Bonjour.ts`, `DevelopmentSession.ts` |
| `src/start/platforms/__mocks__/` | Platform launcher mocks |
| `src/api/user/__mocks__/` | User API mocks |

### Working with the In-Memory Filesystem

Unit tests use `memfs` for filesystem operations. Set up test files with `vol`:

```ts
import { vol } from 'memfs';

beforeEach(() => {
  vol.reset();  // Clear filesystem between tests
});

it('reads a config file', () => {
  // Create in-memory files
  vol.fromJSON({
    '/project/package.json': JSON.stringify({ name: 'test' }),
    '/project/app.json': JSON.stringify({ expo: { name: 'Test' } }),
  });

  // Your code using fs will read from memfs
  const result = readConfig('/project');
  expect(result.name).toBe('Test');
});
```

### Overriding Mocks in Tests

```ts
// Use real implementation for specific test
jest.unmock('fs');

// Mock with custom implementation
jest.mock('../myModule', () => ({
  myFunction: jest.fn(() => 'mocked value'),
}));

// Spy on mocked function
import spawnAsync from '@expo/spawn-async';
(spawnAsync as jest.Mock).mockResolvedValueOnce({
  stdout: 'custom output',
  stderr: '',
  status: 0,
});
```

### Adding New Mocks

1. **For npm packages**: Create `__mocks__/<package-name>.ts` in root `__mocks__/`
2. **For scoped packages**: Create `__mocks__/@scope/package.ts`
3. **For internal modules**: Create `__mocks__/module.ts` next to the source file
4. **Register in `jest.setup.ts`**: Add `jest.mock('<module>')` if it should be global

Example mock structure:

```ts
// __mocks__/my-package.ts

// Option 1: Simple mock
export default jest.fn();

// Option 2: Partial mock with real implementation
const actual = jest.requireActual('my-package');
module.exports = {
  ...actual,
  riskyFunction: jest.fn(),
};

// Option 3: Full mock with types
import type { MyType } from 'my-package';
export const myFunction = jest.fn<MyType, []>(() => ({ /* mock data */ }));
```

### Writing Unit Tests

```ts
// src/start/server/metro/__tests__/externals.test.ts
import { isNodeExternal } from '../externals';

describe(isNodeExternal, () => {
  it('should return the correct module id', () => {
    expect(isNodeExternal('node:fs')).toBe('fs');
    expect(isNodeExternal('fs')).toBe('fs');
  });

  it('should return null for non-node modules', () => {
    expect(isNodeExternal('expo')).toBe(null);
  });
});
```

### Running Unit Tests

```bash
# All unit tests
yarn test

# Specific file
yarn test src/start/server/metro/__tests__/externals.test.ts

# Watch mode
yarn test --watch
```

## E2E CLI Tests

E2E tests run actual CLI commands against real project fixtures.

### Test Utilities

Located in `e2e/utils/`:

| File | Purpose |
|------|---------|
| `expo.ts` | `executeExpoAsync()`, `createExpoStart()`, `createExpoServe()` |
| `server.ts` | `createBackgroundServer()`, `findFreePortAsync()` |
| `process.ts` | Process spawning and output collection |
| `hmr.ts` | Hot module replacement testing utilities |
| `package.ts` | Package tarball creation for linking |
| `path.ts` | Temporary directory management |

### Custom Matchers

E2E tests include custom Jest matchers (`e2e/jest/expect-path.ts`):

```ts
// Cross-platform path matching (normalizes Windows paths)
expect('/Users/foo\\bar').toMatchPath('/Users/foo/bar');
expect(somePath).toMatchPath(/packages\/.*\/src/);

// Asymmetric matcher
expect({ path: '/foo/bar' }).toEqual({
  path: expect.pathMatching('/foo/bar')
});
```

### Project Fixtures

Fixtures are in `e2e/fixtures/`. Create test projects with:

```ts
import { setupTestProjectWithOptionsAsync } from './utils';

const projectRoot = await setupTestProjectWithOptionsAsync(
  'my-test',      // unique test name
  'with-assets',  // fixture name from e2e/fixtures/
  {
    reuseExisting: false,  // set true for faster local iteration
    linkExpoPackages: ['expo-router'],  // link local packages
  }
);
```

### Background Server Testing

Test long-running servers like `expo start`:

```ts
import { createExpoStart } from '../utils/expo';

const expoStart = createExpoStart({
  cwd: projectRoot,
  env: { NODE_ENV: 'development' },
});

await expoStart.startAsync();

// Fetch bundles
const response = await expoStart.fetchBundleAsync('/index.bundle?platform=ios');

// Fetch as Expo Go
const manifest = await expoStart.fetchExpoGoManifestAsync();

await expoStart.stopAsync();
```

### Writing E2E Tests

```ts
// e2e/__tests__/export.test.ts
import { executeExpoAsync } from '../utils/expo';
import { setupTestProjectWithOptionsAsync, projectRoot } from './utils';

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.CI = '1';
});

it('runs `npx expo export --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['export', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`...`);
});

describe('server', () => {
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await setupTestProjectWithOptionsAsync('basic-export', 'with-assets');
  });

  it('exports static files', async () => {
    await executeExpoAsync(projectRoot, ['export', '--platform', 'web']);
    expect(fs.existsSync(path.join(projectRoot, 'dist/index.html'))).toBe(true);
  });
});
```

### Running E2E Tests

```bash
# All E2E tests
yarn test:e2e

# Specific test file
yarn test:e2e export.test.ts

# With pattern matching
yarn test:e2e --testNamePattern="exports static"
```

## Playwright Tests

Browser-based tests for Metro web features using Playwright.

### Structure

```
e2e/playwright/
├── page.ts           # Page utilities (error collection)
├── dev/              # Development server tests
│   ├── fast-refresh.test.ts
│   ├── hmr-env-vars.test.ts
│   └── ...
└── prod/             # Production export tests
```

### Writing Playwright Tests

```ts
// e2e/playwright/dev/fast-refresh.test.ts
import { test, expect } from '@playwright/test';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

const projectRoot = getRouterE2ERoot();

test.describe('fast-refresh', () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      E2E_ROUTER_SRC: 'fast-refresh',  // __e2e__ subdirectory
    },
  });

  test.beforeEach(async () => {
    await expoStart.startAsync();
  });

  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  test('route updates with fast refresh', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(expoStart.url.toString());
    await expect(page.locator('[data-testid="counter"]')).toHaveText('0');

    // Trigger state change
    await page.locator('[data-testid="increment"]').click();
    await expect(page.locator('[data-testid="counter"]')).toHaveText('1');

    expect(pageErrors.all).toEqual([]);
  });
});
```

### Running Playwright Tests

```bash
# All Playwright tests
yarn test:playwright

# Specific test file
yarn test:playwright dev/fast-refresh.test.ts

# With UI mode
npx playwright test --ui
```

## Router E2E (`apps/router-e2e`)

Integration tests for Expo Router features. Test fixtures live in `apps/router-e2e/__e2e__/`.

### Structure

Each subdirectory in `__e2e__/` is a runnable Expo Router project:

```
apps/router-e2e/__e2e__/
├── 01-rsc/              # React Server Components
├── 02-server-actions/   # Server Actions
├── fast-refresh/        # HMR tests
├── static-rendering/    # SSG tests
├── server/              # API routes
├── native-tabs/         # Native tab navigation
└── ...
```

### Environment Variables

Configure which project to run via environment variables:

| Variable | Description |
|----------|-------------|
| `E2E_ROUTER_SRC` | Subdirectory name in `__e2e__/` (e.g., `fast-refresh`) |
| `E2E_ROUTER_JS_ENGINE` | JavaScript engine (`hermes`, `jsc`) |
| `E2E_ROUTER_ASYNC` | Async chunk loading mode |

### Running Router E2E Tests

From `packages/@expo/cli`:

```bash
# Run Playwright tests for a specific router project
E2E_ROUTER_SRC=fast-refresh yarn test:playwright dev/fast-refresh.test.ts

# Or use the npm scripts in router-e2e
cd apps/router-e2e
yarn start:01-rsc        # Start specific project
yarn export:static-rendering  # Export specific project
```

### Maestro Tests (Native)

Native navigation tests use Maestro. From `apps/router-e2e`:

```bash
yarn test:e2e  # Starts Expo and runs maestro tests
```

Maestro test files are in `apps/router-e2e/__e2e__/*/maestro/` or `apps/router-e2e/maestro/`.

## Adding New Tests

### Unit Test Checklist

1. Create `__tests__/myFeature.test.ts` next to source file
2. Import the function/module directly
3. Mock external dependencies as needed
4. Use descriptive `describe`/`it` blocks

### E2E Test Checklist

1. Determine if you need a new fixture or can use existing one
2. Add fixture to `e2e/fixtures/` if needed
3. Create test file in `e2e/__tests__/`
4. Use `setupTestProjectWithOptionsAsync()` for project setup
5. Use `executeExpoAsync()` for CLI commands
6. Clean up temp files in `afterAll`

### Playwright Test Checklist

1. Add route files to appropriate `apps/router-e2e/__e2e__/<project>/app/`
2. Create test in `e2e/playwright/dev/` or `e2e/playwright/prod/`
3. Use `createExpoStart()` for dev server
4. Use `pageCollectErrors()` to catch console/page errors
5. Remember to call `stopAsync()` in `afterEach`

## Debugging Tests

### Verbose Output

```bash
# E2E tests with verbose logging
DEBUG=expo:* yarn test:e2e

# Or enable GitHub Actions debug mode
RUNNER_DEBUG=1 yarn test:e2e
```

### Playwright Debug Mode

```bash
# Run with browser visible
npx playwright test --headed

# Debug mode with inspector
npx playwright test --debug

# Generate trace for failures
npx playwright test --trace on
```

### Reusing Projects Locally

For faster iteration, reuse test projects:

```ts
const projectRoot = await setupTestProjectWithOptionsAsync('my-test', 'fixture', {
  reuseExisting: true,  // Skip reinstall if project exists
});
```

## Test Timeouts

- Unit tests: Default Jest timeout
- E2E tests: 3 minutes (5 minutes on Windows)
- Playwright tests: 3 minutes (5 minutes on Windows)

Configure in respective config files if needed.
