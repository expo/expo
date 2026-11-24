import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatAbiFailure, formatAbiFindings } from './Report';

const FINDINGS = new Map([
  [
    'ExpoModulesCore',
    [{ section: 'Removed Decls', message: 'Func Record.decode(_:in:) has been removed' }],
  ],
  [
    'ExpoModulesJSI',
    [{ section: 'Removed Decls', message: 'Func JavaScriptValue.asObject() has been removed' }],
  ],
]);

describe('formatAbiFailure', () => {
  it('lists findings per module', () => {
    const text = formatAbiFailure(FINDINGS, ['expo-camera', 'expo-font']);
    for (const expected of [
      'ExpoModulesCore',
      'ExpoModulesJSI',
      'Func Record.decode(_:in:) has been removed',
      'Func JavaScriptValue.asObject() has been removed',
      'expo-camera',
      'expo-font',
      'remove the "check: ABI" label',
    ]) {
      assert.ok(text.includes(expected), expected);
    }
    assert.doesNotMatch(text, /minor|abi-check/);
  });

  it('formatAbiFindings lists findings without failure text', () => {
    const text = formatAbiFindings(FINDINGS);
    assert.ok(text.includes('Func Record.decode(_:in:) has been removed'), text);
    assert.ok(text.includes('Func JavaScriptValue.asObject() has been removed'), text);
    assert.doesNotMatch(text, /failed|To fix it/);
  });

  it('starts with what failed', () => {
    const text = formatAbiFailure(FINDINGS, ['expo-camera']);
    assert.ok(text.startsWith('Swift ABI check failed:'), text.split('\n')[0]);
  });
});
