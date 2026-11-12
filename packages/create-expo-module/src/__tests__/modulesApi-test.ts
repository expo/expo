import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getModulesApiV2Dir, resolveModulesApi } from '../modulesApi';
import { UserError } from '../utils/errors';

describe(resolveModulesApi, () => {
  let templatePath: string;
  let log: jest.SpyInstance;

  beforeEach(() => {
    templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-module-template-'));
    fs.mkdirSync(getModulesApiV2Dir(templatePath), { recursive: true });
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(templatePath, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it.each([
    ['an unknown SDK', null],
    ['a supported SDK', 58],
  ])('defaults to v2 in %s', (_label, sdkVersion) => {
    expect(resolveModulesApi(undefined, templatePath, sdkVersion)).toBe('v2');
    expect(log).not.toHaveBeenCalled();
  });

  it('uses v1 when requested, even when v2 is supported', () => {
    expect(resolveModulesApi('v1', templatePath, 58)).toBe('v1');
  });

  it('falls back to v1 in an SDK older than 58', () => {
    expect(resolveModulesApi(undefined, templatePath, 57)).toBe('v1');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Expo SDK 57'));
  });

  it('falls back to v1 with a template that has no Expo Modules API 2.0 files', () => {
    fs.rmSync(getModulesApiV2Dir(templatePath), { recursive: true });
    expect(resolveModulesApi(undefined, templatePath, null)).toBe('v1');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('module template'));
  });

  it('throws when v2 is requested in an SDK older than 58', () => {
    expect(() => resolveModulesApi('v2', templatePath, 57)).toThrow('--modules-api v1');
  });

  it('throws when v2 is requested with a template that has no Expo Modules API 2.0 files', () => {
    fs.rmSync(getModulesApiV2Dir(templatePath), { recursive: true });
    expect(() => resolveModulesApi('v2', templatePath, 58)).toThrow(UserError);
  });
});
