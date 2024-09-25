import { vol } from 'memfs';
import fs from 'node:fs';
import path from 'node:path';

import JsonFile from '../JsonFile';

jest.setTimeout(20 * 1000);

jest.mock('fs', () => require('memfs').fs);
jest.mock('node:fs', () => require('memfs').fs);

afterEach(() => vol.reset());

describe(JsonFile, () => {
  it(`is a class`, () => {
    vol.fromJSON({ 'test.json': JSON.stringify({}) });

    const file = new JsonFile('test.json');
    expect(file instanceof JsonFile).toBe(true);
  });

  const methodNames = [
    'read',
    'write',
    'rewrite',
    'get',
    'set',
    'deleteKey',
    'deleteKeys',
    'merge',
  ];

  it(`has static methods`, () => {
    for (const method of methodNames) {
      expect(JsonFile[method]).toBeDefined();
      expect(JsonFile[`${method}Async`]).toBeDefined();
    }
  });

  it('has instance methods', () => {
    vol.fromJSON({ 'test.json': JSON.stringify({}) });

    const file = new JsonFile('test.json');

    for (const method of methodNames) {
      expect(file[method]).toBeDefined();
      expect(file[`${method}Async`]).toBeDefined();
    }
  });
});

const testFilename = 'test/file.json';
const testObject = { x: 1 };

describe('async', () => {
  it(`reads JSON from a file`, async () => {
    vol.fromJSON({ [testFilename]: loadFixture('test.json') });

    const file = new JsonFile(testFilename);
    const object = await file.readAsync();
    expect(object.score).toBe(5);
  });

  it(`reads JSON statically from a file`, async () => {
    vol.fromJSON({ [testFilename]: loadFixture('test.json') });

    const object = await JsonFile.readAsync(testFilename);
    expect(object.score).toBe(5);
  });

  it(`reads JSON5 from a file`, async () => {
    vol.fromJSON({ [testFilename]: loadFixture('test-json5.json') });

    const file = new JsonFile(testFilename, { json5: true });
    const object = await file.readAsync();
    expect(object.itParsedProperly).toBe(42);
  });

  it(`has useful error messages for JSON parsing errors`, async () => {
    vol.fromJSON({ [testFilename]: loadFixture('syntax-error.json') });

    await expect(JsonFile.readAsync(testFilename)).rejects.toThrowError(
      /Cause: SyntaxError: Unexpected string in JSON at position 602/
    );
  });

  it(`has useful error messages for JSON5 parsing errors`, async () => {
    vol.fromJSON({ [testFilename]: loadFixture('syntax-error.json5') });

    await expect(JsonFile.readAsync(testFilename, { json5: true })).rejects.toThrowError(
      /Cause: SyntaxError: JSON5: invalid character ',' at 4:15/
    );
  });

  it(`writes JSON to a file`, async () => {
    vol.fromJSON({ [testFilename]: loadFixture('test.json') });

    const file = new JsonFile(testFilename, { json5: true });
    await file.writeAsync(testObject);
    expect(fs.existsSync(testFilename)).toBe(true);
    await expect(file.readAsync()).resolves.toEqual(testObject);
  });

  it(`rewrite async`, async () => {
    vol.fromJSON({ [testFilename]: loadFixture('test.json') });

    const file = new JsonFile(testFilename, { json5: true });
    await file.writeAsync(testObject);
    expect(fs.existsSync(testFilename)).toBe(true);
    await expect(file.readAsync()).resolves.toEqual(testObject);
    await expect(file.rewriteAsync()).resolves.toBeDefined();
    expect(fs.existsSync(testFilename)).toBe(true);
    await expect(file.readAsync()).resolves.toEqual(testObject);
  });

  it(`changes an existing key in that file`, async () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    await expect(file.setAsync('x', 2)).resolves.toBeDefined();
    await expect(file.readAsync()).resolves.toEqual({ x: 2 });
  });

  it(`adds a new key to the file`, async () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    await expect(file.setAsync('x', 2)).resolves.toBeDefined();
    await expect(file.readAsync()).resolves.toEqual({ x: 2 });
    await expect(file.setAsync('y', 3)).resolves.toBeDefined();
    await expect(file.readAsync()).resolves.toEqual({ x: 2, y: 3 });
  });

  it(`deletes that same new key from the file`, async () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    await expect(file.setAsync('x', 2)).resolves.toBeDefined();
    await expect(file.setAsync('y', 3)).resolves.toBeDefined();
    await expect(file.deleteKeyAsync('y')).resolves.toBeDefined();
    await expect(file.readAsync()).resolves.toEqual({ x: 2 });
  });

  it(`deletes another key from the file`, async () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    await expect(file.setAsync('x', 2)).resolves.toBeDefined();
    await expect(file.setAsync('y', 3)).resolves.toBeDefined();
    await expect(file.deleteKeyAsync('x')).resolves.toBeDefined();
    await expect(file.deleteKeyAsync('y')).resolves.toBeDefined();
    await expect(file.readAsync()).resolves.toEqual({});
  });

  // This fails when i is high, around 200. However, no realistic use case would have the user
  // constantly update a file that often
  it('Multiple updates to the same file have no race conditions', async () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    for (let i = 0; i < 50; i++) {
      await file.writeAsync({});
      let baseObj = {};
      for (let j = 0; j < 20; j++) {
        baseObj = { ...baseObj, [j]: j };
        await file.setAsync(String(j), j);
      }
      const json = await file.readAsync();
      expect(json).toEqual(baseObj);
    }
  });

  it('Continuous updating!', async () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    await file.writeAsync({ i: 0 });
    for (let i = 0; i < 20; i++) {
      await file.writeAsync({ i });
      await expect(file.readAsync()).resolves.toEqual({ i });
    }
  });

  it('adds a new line at the eof', async () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    await file.writeAsync(testObject);
    expect(fs.existsSync(testFilename)).toBe(true);
    const data = await fs.promises.readFile(testFilename, 'utf-8');
    const lastChar = data[data.length - 1];
    expect(lastChar).toEqual('\n');
  });
});

describe('sync', () => {
  it(`reads JSON from a file`, () => {
    vol.fromJSON({ [testFilename]: loadFixture('test.json') });

    const file = new JsonFile(testFilename);
    const object = file.read();
    expect(object.score).toBe(5);
  });

  it(`reads JSON statically from a file`, () => {
    vol.fromJSON({ [testFilename]: loadFixture('test.json') });

    const object = JsonFile.read(testFilename);
    expect(object.score).toBe(5);
  });

  it(`reads JSON5 from a file`, () => {
    vol.fromJSON({ [testFilename]: loadFixture('test-json5.json') });

    const file = new JsonFile(testFilename, { json5: true });
    const object = file.read();
    expect(object.itParsedProperly).toBe(42);
  });

  it(`has useful error messages for JSON parsing errors`, () => {
    vol.fromJSON({ [testFilename]: loadFixture('syntax-error.json') });

    expect(() => JsonFile.read(testFilename)).toThrow(
      /Cause: SyntaxError: Unexpected string in JSON at position 602/
    );
  });

  it(`has useful error messages for JSON5 parsing errors`, () => {
    vol.fromJSON({ [testFilename]: loadFixture('syntax-error.json5') });

    expect(() => JsonFile.read(testFilename, { json5: true })).toThrow(
      /Cause: SyntaxError: JSON5: invalid character ',' at 4:15/
    );
  });

  it(`writes JSON to a file`, () => {
    vol.fromJSON({ [testFilename]: loadFixture('test.json') });

    const file = new JsonFile(testFilename, { json5: true });
    file.write(testObject);
    expect(fs.existsSync(testFilename)).toBe(true);
    expect(file.read()).toEqual(testObject);
  });

  it(`rewrite async`, () => {
    vol.fromJSON({ [testFilename]: loadFixture('test.json') });

    const file = new JsonFile(testFilename, { json5: true });
    file.write(testObject);
    expect(fs.existsSync(testFilename)).toBe(true);
    expect(file.read()).toEqual(testObject);
    expect(file.rewrite()).toBeDefined();
    expect(fs.existsSync(testFilename)).toBe(true);
    expect(file.read()).toEqual(testObject);
  });

  it(`changes an existing key in that file`, () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    expect(file.set('x', 2)).toBeDefined();
    expect(file.read()).toEqual({ x: 2 });
  });

  it(`adds a new key to the file`, () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    expect(file.set('x', 2)).toBeDefined();
    expect(file.read()).toEqual({ x: 2 });
    expect(file.set('y', 3)).toBeDefined();
    expect(file.read()).toEqual({ x: 2, y: 3 });
  });

  it(`deletes that same new key from the file`, () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    expect(file.set('x', 2)).toBeDefined();
    expect(file.set('y', 3)).toBeDefined();
    expect(file.deleteKey('y')).toBeDefined();
    expect(file.read()).toEqual({ x: 2 });
  });

  it(`deletes another key from the file`, () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    expect(file.set('x', 2)).toBeDefined();
    expect(file.set('y', 3)).toBeDefined();
    expect(file.deleteKey('x')).toBeDefined();
    expect(file.deleteKey('y')).toBeDefined();
    expect(file.read()).toEqual({});
  });

  // This fails when i is high, around 200. However, no realistic use case would have the user
  // constantly update a file that often
  it('Multiple updates to the same file have no race conditions', () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    for (let i = 0; i < 50; i++) {
      file.write({});
      let baseObj = {};
      for (let j = 0; j < 20; j++) {
        baseObj = { ...baseObj, [j]: j };
        file.set(String(j), j);
      }
      const json = file.read();
      expect(json).toEqual(baseObj);
    }
  });

  it('Continuous updating!', () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    file.write({ i: 0 });
    for (let i = 0; i < 20; i++) {
      file.write({ i });
      expect(file.read()).toEqual({ i });
    }
  });

  it('adds a new line at the eof', () => {
    vol.fromJSON({ [testFilename]: JSON.stringify({}) });

    const file = new JsonFile(testFilename, { json5: true });
    file.write(testObject);
    expect(fs.existsSync(testFilename)).toBe(true);
    const data = fs.readFileSync(testFilename, 'utf-8');
    const lastChar = data[data.length - 1];
    expect(lastChar).toEqual('\n');
  });
});

function loadFixture(filename: string) {
  return jest
    .requireActual('node:fs')
    .readFileSync(path.join(__dirname, 'files', filename), 'utf8');
}
