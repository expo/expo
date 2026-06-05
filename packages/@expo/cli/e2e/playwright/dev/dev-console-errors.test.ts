import { test, expect } from '@playwright/test';
import { stripVTControlCharacters } from 'node:util';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { openPageAndEagerlyLoadJS } from '../../utils/hmr';
import { processCollectOutput } from '../../utils/process';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();

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
    await page.getByText('Runtime error: throw new Error').click();

    const expectedConsoleOutput = `
Web  ERROR  [Error: E2E_UNHANDLED_THROW] 

Code: index.tsx
  42 |         title="Runtime error: throw new Error"
  43 |         onPress={() => {
> 44 |           throw new Error('E2E_UNHANDLED_THROW');
     |                 ^
  45 |         }}
  46 |       />
  47 |       <BigButton
Call Stack
  BigButton.props.onPress (apps/router-e2e/__e2e__/06-errors/app/index.tsx:44:17)

Code: index.tsx
  152 |   return (
  153 |     <Text
> 154 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
      |              ^
  155 |       onPress={onPress}>
  156 |       {title}
  157 |     </Text>
Call Stack
  BigButton (apps/router-e2e/__e2e__/06-errors/app/index.tsx:154:14)
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:41:7)
    `.trim();

    await expectOutput(output, expectedConsoleOutput);
  });

  test('prints call stack of unhandled rejections', async ({
    page,
  }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('Runtime error: async throw new Error').click();

    const expectedConsoleOutput = `
Web  ERROR  [Error: E2E_UNHANDLED_ASYNC_THROW] 

Code: index.tsx
  49 |         onPress={() => {
  50 |           async function throwAsyncError() {
> 51 |             throw new Error('E2E_UNHANDLED_ASYNC_THROW');
     |                   ^
  52 |           }
  53 |           void throwAsyncError();
  54 |         }}
Call Stack
  throwAsyncError (apps/router-e2e/__e2e__/06-errors/app/index.tsx:51:19)
    `.trim();

    await expectOutput(output, expectedConsoleOutput);
  });

  test('prints component stack of unhandled thrown non-Error values (strings)', async ({ page }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('Runtime error: throw string').click();

    const expectedConsoleOutput = [
      'Web  ERROR  E2E_UNHANDLED_THROW_STRING ',
      '',
      'Code: index.tsx',
      '  151 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {',
      '  152 |   return (',
      '> 153 |     <Text',
      '      |     ^',
      "  154 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}",
      '  155 |       onPress={onPress}>',
      '  156 |       {title}',
      'Call Stack',
      '  BigButton (apps/router-e2e/__e2e__/06-errors/app/index.tsx:153:5)',
      '  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:56:7)',
    ].join('\n');

    await expectOutput(output, expectedConsoleOutput);
  });

  test('prints no stack for unhandled rejected non-Error values (strings)', async ({ page }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('Runtime error: reject string').click();

    await expectOutput(output, 'Web  ERROR  E2E_UNHANDLED_REJECTION_STRING');
    expectNoStackTrace(output);
  });

  test('prints call stack and component stack for console.error Error', async ({
    page,
  }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('console.error: E2E Error').click();

    // TODO: This is not right, it prints only the component stack (twice)
    const expectedConsoleOutput = `
Web  ERROR  [Error: E2E_CONSOLE_ERROR_OBJECT] 

Code: index.tsx
  151 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  152 |   return (
> 153 |     <Text
      |     ^
  154 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  155 |       onPress={onPress}>
  156 |       {title}
Call Stack
  BigButton (apps/router-e2e/__e2e__/06-errors/app/index.tsx:153:5)
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:100:7)

Code: index.tsx
  151 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  152 |   return (
> 153 |     <Text
      |     ^
  154 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  155 |       onPress={onPress}>
  156 |       {title}
Call Stack
  BigButton (apps/router-e2e/__e2e__/06-errors/app/index.tsx:153:5)
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:100:7)
    `.trim();

    await expectOutput(output, expectedConsoleOutput);
  });

  test('prints call stack and component stack of console.error non-Error values (strings)', async ({
    page,
  }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('console.error: E2E string').click();

    const expectedConsoleOutput = `
Web  ERROR  E2E_CONSOLE_ERROR_STRING

Code: index.tsx
  107 |         title="console.error: E2E string"
  108 |         onPress={() => {
> 109 |           console.error('E2E_CONSOLE_ERROR_STRING');
      |                   ^
  110 |         }}
  111 |       />
  112 |       <BigButton
Call Stack
  BigButton.props.onPress (apps/router-e2e/__e2e__/06-errors/app/index.tsx:109:19)

Code: index.tsx
  151 | function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  152 |   return (
> 153 |     <Text
      |     ^
  154 |       style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
  155 |       onPress={onPress}>
  156 |       {title}
Call Stack
  BigButton (apps/router-e2e/__e2e__/06-errors/app/index.tsx:153:5)
  App (apps/router-e2e/__e2e__/06-errors/app/index.tsx:106:7)
    `.trim();

    await expectOutput(output, expectedConsoleOutput);
  });

  test('prints console.warn strings without stack traces', async ({ page }) => {
    const output = processCollectOutput(expoStart.process);

    await openPageAndEagerlyLoadJS(expoStart, page);
    await page.getByText('console.warn: E2E string').click();

    await expectOutput(output, 'Web  WARN  E2E_CONSOLE_WARN_STRING');
    expectNoStackTrace(output);
  });
});

async function expectOutput(output: { all: string }, expectedConsoleOutput: string) {
  await expect
    .poll(() => stripVTControlCharacters(output.all), { timeout: 30_000 })
    .toContain(expectedConsoleOutput);
}

function expectNoStackTrace(output: { all: string }) {
  const terminalOutput = stripVTControlCharacters(output.all);
  // `http://localhost:8081/apps/router-e2e` would mean an unsymbolicated stack trace leaked.
  expect(terminalOutput).not.toContain('http://localhost:8081/apps/router-e2e');
  // `apps/router-e2e/__e2e__/06-errors/app/index.tsx` would mean a symbolicated stack trace leaked.
  expect(terminalOutput).not.toContain('apps/router-e2e/__e2e__/06-errors/app/index.tsx');
}
