import * as jsondiffpatch from 'jsondiffpatch';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVersionsDelta } from './VersionsDiff';

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function format(before: any, after: any): string {
  const delta = jsondiffpatch.diff(before, after)!;
  return stripAnsi(formatVersionsDelta(delta, before));
}

describe('formatVersionsDelta', () => {
  it('collapses unchanged nested objects and arrays', () => {
    const before = {
      expoGoSdkVersion: '54.0.0',
      sdkVersions: {
        '53.0.0': { expoVersion: '~53.0.27', relatedPackages: { jest: '~29.7.0' } },
        '54.0.0': { expoVersion: '~54.0.37' },
      },
      templates: [{ id: 'blank' }, { id: 'tabs' }],
    };
    const after = { ...before, expoGoSdkVersion: '57.0.0' };

    const output = format(before, after);

    assert.match(output, /expoGoSdkVersion: "54\.0\.0" => "57\.0\.0"/);
    assert.match(output, /sdkVersions: \{ … 2 keys unchanged \}/);
    assert.match(output, /templates: \[ … 2 items unchanged \]/);
    assert.doesNotMatch(output, /expoVersion/);
    assert.doesNotMatch(output, /blank/);
  });

  it('keeps unchanged primitive values as context', () => {
    const before = { androidVersion: '2.24.6', iosVersion: '2.25.1' };
    const after = { ...before, iosVersion: '2.26.0' };

    const output = format(before, after);

    assert.match(output, /androidVersion: "2\.24\.6"/);
    assert.match(output, /iosVersion: "2\.25\.1" => "2\.26\.0"/);
  });

  it('expands only the changed branch of a nested object', () => {
    const before = {
      sdkVersions: {
        '53.0.0': { expoVersion: '~53.0.27', relatedPackages: { jest: '~29.7.0' } },
        '54.0.0': { expoVersion: '~54.0.37', relatedPackages: { jest: '~29.7.0' } },
      },
    };
    const after = {
      sdkVersions: {
        ...before.sdkVersions,
        '54.0.0': { expoVersion: '~54.0.38', relatedPackages: { jest: '~29.7.0' } },
      },
    };

    const output = format(before, after);

    assert.match(output, /53\.0\.0: \{ … 2 keys unchanged \}/);
    assert.match(output, /expoVersion: "~54\.0\.37" => "~54\.0\.38"/);
    assert.match(output, /relatedPackages: \{ … 1 key unchanged \}/);
  });

  it('still prints added and deleted values in full', () => {
    const before = { sdkVersions: { '54.0.0': { expoVersion: '~54.0.37' } } };
    const after = {
      sdkVersions: { ...before.sdkVersions, '55.0.0': { expoVersion: '~55.0.0' } },
    };

    const output = format(before, after);

    assert.match(output, /55\.0\.0: \{\s+"expoVersion": "~55\.0\.0"\s+\}/);
    assert.match(output, /54\.0\.0: \{ … 1 key unchanged \}/);
  });

  it('labels an empty unchanged container', () => {
    const before = { a: 1, empty: {}, list: [] as any[] };
    const after = { ...before, a: 2 };

    const output = format(before, after);

    assert.match(output, /empty: \{\}/);
    assert.match(output, /list: \[\]/);
  });
});
