import os from 'os';

import { createContext } from '../context';

const originalVersion = process.env.__EXPO_VERSION;

jest.mock('ci-info', () => ({ isCI: true, isPR: true, name: 'GitHub Actions' }));

beforeEach(() => {
  delete process.env.__EXPO_VERSION;
});

afterAll(() => {
  process.env.__EXPO_VERSION = originalVersion;
});

it('contains os name and version', () => {
  expect(createContext().os).toMatchObject({
    name: os.platform(),
    version: os.release(),
  });
});

it('contains app name and version', () => {
  process.env.__EXPO_VERSION = '1337';
  expect(createContext().app).toMatchObject({
    name: 'expo/cli',
    version: '1337',
  });
});

it('contains ci name and if its executed from PR', () => {
  expect(createContext().ci).toMatchObject({
    name: 'GitHub Actions',
    isPr: true,
  });
});
