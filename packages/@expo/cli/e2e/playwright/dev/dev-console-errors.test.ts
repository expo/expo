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
  42 |         title="throw new Error()"
  43 |         onPress={() => {
> 44 |           throw new Error('unhandled-throw');
     |                 ^
  45 |         }}
  46 |       />
  47 |       <BigButton
Call Stack
  BigButton.props.onPress (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:44:17)

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
  App (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:41:7)
        `.trim()
      );
    } else {
      await expectOutput(
        output,
        `
Web  ERROR  [Error: unhandled-throw]

Code: index.tsx
  42 |         title="throw new Error()"
  43 |         onPress={() => {
> 44 |           throw new Error('unhandled-throw');
     |                 ^
  45 |         }}
  46 |       />
  47 |       <BigButton
Call Stack
  BigButton.props.onPress (apps/router-e2e/__e2e__/06-errors/app/index.tsx:44:17)

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
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:41:7)
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
  49 |         onPress={() => {
  50 |           async function throwAsyncError() {
> 51 |             throw new Error('unhandled-async-throw');
     |                   ^
  52 |           }
  53 |           void throwAsyncError();
  54 |         }}
Call Stack
  throwAsyncError (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:51:19)
  BigButton.props.onPress (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:53:16)
        `.trim()
      );
    } else {
      await expectOutput(
        output,
        `
Web  ERROR  [Error: unhandled-async-throw]

Code: index.tsx
  49 |         onPress={() => {
  50 |           async function throwAsyncError() {
> 51 |             throw new Error('unhandled-async-throw');
     |                   ^
  52 |           }
  53 |           void throwAsyncError();
  54 |         }}
Call Stack
  throwAsyncError (apps/router-e2e/__e2e__/06-errors/app/index.tsx:51:19)
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
  App (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:56:7)
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
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:56:7)
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
  89 |         title="console.error(new Error())"
  90 |         onPress={() => {
> 91 |           console.error(new Error('console-error-object'));
     |                         ^
  92 |         }}
  93 |       />
  94 |       <BigButton
Call Stack
  BigButton.props.onPress (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:91:25)

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
  App (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:88:7)
        `.trim()
      );
    } else {
      await expectOutput(
        output,
        `
Web  ERROR  [Error: console-error-object]

Code: index.tsx
  89 |         title="console.error(new Error())"
  90 |         onPress={() => {
> 91 |           console.error(new Error('console-error-object'));
     |                         ^
  92 |         }}
  93 |       />
  94 |       <BigButton
Call Stack
  BigButton.props.onPress (apps/router-e2e/__e2e__/06-errors/app/index.tsx:91:25)

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
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:88:7)
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

    if (isWindows) {
      // NOTE: On Windows the call stack additionally leads with internal
      // `packages/expo` and `packages/@expo/log-box` frames, because in this monorepo
      // those workspace packages resolve to real `packages/...` paths instead of
      // `node_modules/...` (so the node_modules collapse patterns miss them). A real app
      // installs them under node_modules and they collapse. We assert the component stack here.
      await expectOutput(
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
  BigButton (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:141:5)
  App (apps\\router-e2e\\__e2e__\\06-errors\\app\\index.tsx:94:7)
        `.trim()
      );
    } else {
      await expectOutput(
        output,
        `
Web  ERROR  console-error-string

Code: index.tsx
   95 |         title="console.error(string)"
   96 |         onPress={() => {
>  97 |           console.error('console-error-string');
      |                   ^
   98 |         }}
   99 |       />
  100 |       <BigButton
Call Stack
  BigButton.props.onPress (apps/router-e2e/__e2e__/06-errors/app/index.tsx:97:19)

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
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:94:7)
        `.trim()
      );
    }
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
