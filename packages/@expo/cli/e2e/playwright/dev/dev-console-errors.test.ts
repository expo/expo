import { test, expect } from '@playwright/test';
import { platform } from 'node:process';
import { stripVTControlCharacters } from 'node:util';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { openPageAndEagerlyLoadJS } from '../../utils/hmr';
import { processCollectOutput } from '../../utils/process';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const isWindows = platform === 'win32';

test.describe('dev console errors', () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: '06-errors',
      E2E_ROUTER_ASYNC: 'development',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeEach(async () => {
    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');

    console.time('Eagerly bundled JS');
    await expoStart.fetchBundleAsync('/').then((response) => response.text());
    console.timeEnd('Eagerly bundled JS');
  });

  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  test('prints call stack and component stack of unhandled errors', async ({ page }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('throw new Error()', { exact: true }).click();

    if (isWindows) {
      await expectOutput(
        output,
        `
Web  ERROR  [Error: unhandled-throw]

Code: index.tsx
  41 |         title="throw new Error()"
  42 |         onPress={() => {
> 43 |           throw new Error('unhandled-throw');
     |                 ^
  44 |         }}
  45 |       />
  46 |       <BigButton
Call Stack
  BigButton.props.onPress (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:43:17)

Code: index.tsx
  139 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  140 |   return (
> 141 |     <Text
      |     ^
  142 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  143 |       onPress={onPress}>
  144 |       {title}
Call Stack
  BigButton (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:141:5)
  App (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:40:7)
        `.trim()
      );
    } else {
      await expectOutput(
        output,
        `
Web  ERROR  [Error: unhandled-throw]

Code: index.tsx
  41 |         title="throw new Error()"
  42 |         onPress={() => {
> 43 |           throw new Error('unhandled-throw');
     |                 ^
  44 |         }}
  45 |       />
  46 |       <BigButton
Call Stack
  BigButton.props.onPress (apps/router-e2e/__e2e__/06-errors/app/index.tsx:43:17)

Code: index.tsx
  139 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  140 |   return (
> 141 |     <Text
      |     ^
  142 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  143 |       onPress={onPress}>
  144 |       {title}
Call Stack
  BigButton (apps/router-e2e/__e2e__/06-errors/app/index.tsx:141:5)
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:40:7)
        `.trim()
      );
    }
  });

  test('prints call stack of unhandled rejections', async ({ page }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('async throw new Error()').click();

    if (isWindows) {
      await expectOutput(
        output,
        `
Web  ERROR  [Error: unhandled-async-throw]

Code: index.tsx
  48 |         onPress={() => {
  49 |           async function throwAsyncError() {
> 50 |             throw new Error('unhandled-async-throw');
     |                   ^
  51 |           }
  52 |           throwAsyncError();
  53 |         }}
Call Stack
  throwAsyncError (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:50:19)
  BigButton.props.onPress (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:52:11)
        `.trim()
      );
    } else {
      await expectOutput(
        output,
        `
Web  ERROR  [Error: unhandled-async-throw]

Code: index.tsx
  48 |         onPress={() => {
  49 |           async function throwAsyncError() {
> 50 |             throw new Error('unhandled-async-throw');
     |                   ^
  51 |           }
  52 |           throwAsyncError();
  53 |         }}
Call Stack
  throwAsyncError (apps/router-e2e/__e2e__/06-errors/app/index.tsx:50:19)
        `.trim()
      );
    }
  });

  test('prints component stack of unhandled thrown non-Error values (strings)', async ({
    page,
  }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('throw string').click();

    if (isWindows) {
      await expectOutput(
        output,
        `
Web  ERROR  unhandled-throw-string

Code: index.tsx
  139 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  140 |   return (
> 141 |     <Text
      |     ^
  142 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  143 |       onPress={onPress}>
  144 |       {title}
Call Stack
  BigButton (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:141:5)
  App (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:55:7)
        `.trim()
      );
    } else {
      await expectOutput(
        output,
        `
Web  ERROR  unhandled-throw-string

Code: index.tsx
  139 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  140 |   return (
> 141 |     <Text
      |     ^
  142 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  143 |       onPress={onPress}>
  144 |       {title}
Call Stack
  BigButton (apps/router-e2e/__e2e__/06-errors/app/index.tsx:141:5)
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:55:7)
        `.trim()
      );
    }
  });

  test('prints no stack for unhandled rejected non-Error values (strings)', async ({ page }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('Promise.reject(string)').click();

    await expectOutput(output, 'Web  ERROR  unhandled-rejection-string');
    expectNoStackTrace(output);
  });

  test('prints call stack and component stack for console.error Error', async ({ page }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('console.error(new Error())').click();

    if (isWindows) {
      await expectOutput(
        output,
        `
Web  ERROR  [Error: console-error-object]

Code: index.tsx
  90 |         title="console.error(new Error())"
  91 |         onPress={() => {
> 92 |           console.error(new Error('console-error-object'));
     |                         ^
  93 |         }}
  94 |       />
  95 |       <BigButton
Call Stack
  BigButton.props.onPress (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:92:25)

Code: index.tsx
  139 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  140 |   return (
> 141 |     <Text
      |     ^
  142 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  143 |       onPress={onPress}>
  144 |       {title}
Call Stack
  BigButton (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:141:5)
  App (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:89:7)
        `.trim()
      );
    } else {
      await expectOutput(
        output,
        `
Web  ERROR  [Error: console-error-object]

Code: index.tsx
  90 |         title="console.error(new Error())"
  91 |         onPress={() => {
> 92 |           console.error(new Error('console-error-object'));
     |                         ^
  93 |         }}
  94 |       />
  95 |       <BigButton
Call Stack
  BigButton.props.onPress (apps/router-e2e/__e2e__/06-errors/app/index.tsx:92:25)

Code: index.tsx
  139 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  140 |   return (
> 141 |     <Text
      |     ^
  142 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  143 |       onPress={onPress}>
  144 |       {title}
Call Stack
  BigButton (apps/router-e2e/__e2e__/06-errors/app/index.tsx:141:5)
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:89:7)
        `.trim()
      );
    }
  });

  test('prints call stack and component stack of console.error non-Error values (strings)', async ({
    page,
  }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('console.error(string)').click();

    // `expo` and `@expo/log-box` are in `packages/` here, not `node_modules/`, so the collapse
    // patterns miss them and those frames show up. In a real app both are installed under
    // `node_modules` and get collapsed.
    await expectOutputAnySeparator(output, 'Web  ERROR  console-error-string');
    await expectOutputAnySeparator(output, 'Code: setupHMR.js');
    // These line numbers come from built output, so don't match on them.
    await expectOutputAnySeparator(
      output,
      'captureCurrentStack (packages/expo/build/async-require/setupHMR.js'
    );
    await expectOutputAnySeparator(
      output,
      'consoleErrorMiddleware (packages/@expo/log-box/build/LogBox.js'
    );
    await expectOutputAnySeparator(
      output,
      'BigButton.props.onPress (apps/router-e2e/__e2e__/06-errors/app/index.tsx:98:19)'
    );

    await expectOutputAnySeparator(
      output,
      `
Code: index.tsx
  139 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  140 |   return (
> 141 |     <Text
      |     ^
  142 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  143 |       onPress={onPress}>
  144 |       {title}
Call Stack
  BigButton (apps/router-e2e/__e2e__/06-errors/app/index.tsx:141:5)
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:95:7)
      `.trim()
    );
  });

  test('prints console.warn strings without stack traces', async ({ page }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('console.warn(string)').click();

    await expectOutput(output, 'Web  WARN  console-warn-string');
    expectNoStackTrace(output);
  });
});

async function expectOutput(output: { all: string }, expectedConsoleOutput: string) {
  await expect
    .poll(() => normalizeConsoleOutput(output.all), { timeout: 30_000 })
    .toContain(normalizeConsoleOutput(expectedConsoleOutput));
}

/** Same as `expectOutput`, but ignores the path separator so Windows matches too. */
async function expectOutputAnySeparator(output: { all: string }, expectedConsoleOutput: string) {
  await expect
    .poll(() => toPosixOutput(output.all), { timeout: 30_000 })
    .toContain(toPosixOutput(expectedConsoleOutput));
}

function toPosixOutput(output: string) {
  return normalizeConsoleOutput(output).replace(/\\/g, '/');
}

function expectNoStackTrace(output: { all: string }) {
  const terminalOutput = normalizeConsoleOutput(output.all);
  // `http://localhost:8081/apps/router-e2e` would mean an unsymbolicated stack trace leaked.
  expect(terminalOutput).not.toContain('http://localhost:8081/apps/router-e2e');
  // `apps/router-e2e/__e2e__/06-errors/app/index.tsx` would mean a symbolicated stack trace leaked.
  expect(terminalOutput).not.toContain('apps/router-e2e/__e2e__/06-errors/app/index.tsx');
  // `apps\router-e2e\__e2e__\06-errors\app\index.tsx` would mean a symbolicated stack trace leaked.
  expect(terminalOutput).not.toContain('apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx');
}

function normalizeConsoleOutput(output: string) {
  return (
    stripVTControlCharacters(output)
      // Remove trailing whitespace from each line.
      .replace(/[ \t]+$/gm, '')
  );
}
