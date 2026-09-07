import type { ExpoJsOutput } from '../jsOutput';
import { shouldSkipReconcile } from '../reconcileTransformSerializerPlugin';

function createOutput(data: Partial<ExpoJsOutput['data']> = {}): ExpoJsOutput {
  return {
    type: 'js/module',
    data: { code: '', lineCount: 1, map: [], ...data },
  } as ExpoJsOutput;
}

const reconcileSettings = { inlineRequires: false } as ExpoJsOutput['data']['reconcile'];

it(`skips non-js modules`, () => {
  expect(shouldSkipReconcile('/app/asset.png', { ...createOutput(), type: 'js/script' })).toBe(
    true
  );
  expect(shouldSkipReconcile('/app/data.json', createOutput())).toBe(true);
});

it(`skips css modules emitted by the CSS pipeline`, () => {
  // `transformShim` wraps these itself and attaches no reconcile settings.
  expect(shouldSkipReconcile('/app/styles.css', createOutput())).toBe(true);
  expect(shouldSkipReconcile('/app/styles.scss', createOutput())).toBe(true);
  expect(shouldSkipReconcile('/app/styles.sass', createOutput())).toBe(true);
});

it(`reconciles css modules that a transformer replaced with JS`, () => {
  expect(
    shouldSkipReconcile('/app/global.css', createOutput({ reconcile: reconcileSettings }))
  ).toBe(false);
});

it(`reconciles regular js modules`, () => {
  expect(shouldSkipReconcile('/app/index.js', createOutput({ reconcile: reconcileSettings }))).toBe(
    false
  );
});
