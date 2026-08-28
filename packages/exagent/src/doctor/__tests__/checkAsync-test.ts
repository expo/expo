// Which `expo-doctor` runs. The parse is `parseDoctorOutput-test.ts`; this is only about the
// resolution, which is the half F113 broke in a monorepo.
import { vol } from 'memfs';
import path from 'path';

import { resolveExpoDoctorCli } from '../checkAsync';

const projectRoot = path.resolve('/project');
const workspace = path.resolve('/workspace');
const app = path.join(workspace, 'apps', 'mobile');
const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

beforeEach(() => {
  mockPlatform('darwin');
  vol.reset();
});

afterEach(() => {
  mockPlatform(realPlatform);
  vol.reset();
});

describe(resolveExpoDoctorCli, () => {
  it(`should prefer the copy the project installed, so the checks match its SDK`, () => {
    const bin = path.join(projectRoot, 'node_modules', '.bin', 'expo-doctor');
    vol.fromJSON({ [bin]: '#!/bin/sh' });

    expect(resolveExpoDoctorCli(projectRoot)).toEqual({ command: bin, args: [] });
  });

  // F113: the registry fallback still *works* in a hoisted workspace, so this one degraded quietly
  // — a download, and a version of the checks the project did not choose.
  it(`should find a copy an npm workspace hoisted above the project`, () => {
    const hoisted = path.join(workspace, 'node_modules', '.bin', 'expo-doctor');
    vol.fromJSON({
      [path.join(workspace, 'package.json')]: '{"workspaces":["apps/*"]}',
      [path.join(app, 'package.json')]: '{"name":"mobile"}',
      [hoisted]: '#!/bin/sh',
    });

    expect(resolveExpoDoctorCli(app)).toEqual({ command: hoisted, args: [] });
  });

  // `expo-doctor` is a tool you run *at* a project rather than a function of its pinned version, so
  // unlike `tsc` it keeps the registry rung when nothing is installed.
  it(`should fall back to the registry when no ancestor has it`, () => {
    vol.fromJSON({ [path.join(projectRoot, 'package.json')]: '{}' });

    expect(resolveExpoDoctorCli(projectRoot)).toEqual({
      command: expect.stringMatching(/^npx(\.cmd)?$/),
      args: ['expo-doctor'],
    });
  });

  it(`should look for the batch shim on Windows`, () => {
    mockPlatform('win32');
    const shim = path.join(projectRoot, 'node_modules', '.bin', 'expo-doctor.cmd');
    vol.fromJSON({ [shim]: '@echo off' });

    expect(resolveExpoDoctorCli(projectRoot)).toEqual({ command: shim, args: [] });
  });
});
