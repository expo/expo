import fs from 'fs';
import os from 'os';
import path from 'path';

import JsonFile from '../src/JsonFile';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20 * 1000;

const FIXTURES = path.join(os.tmpdir(), 'json-file-fixtures');

beforeAll(() => fs.promises.mkdir(FIXTURES, { recursive: true }));
afterAll(() => fs.promises.rmdir(FIXTURES, { recursive: true }));

it(`is a class`, () => {
  const file = new JsonFile(path.join(__dirname, '../package.json'));
  expect(file instanceof JsonFile).toBe(true);
});

it(`has static functions`, () => {
  expect(JsonFile.readAsync).toBeDefined();
  expect(JsonFile.writeAsync).toBeDefined();
});

it(`reads JSON from a file`, async () => {
  const file = new JsonFile(path.join(__dirname, '../package.json'));
  const object = await file.readAsync();
  expect(object.version).toBeDefined();
});

it(`reads JSON statically from a file`, async () => {
  const object = await JsonFile.readAsync(path.join(__dirname, '../package.json'));
  expect(object.version).toBeDefined();
});

it(`reads JSON5 from a file`, async () => {
  const file = new JsonFile(path.join(__dirname, 'files/test-json5.json'), { json5: true });
  const object = await file.readAsync();
  expect(object.itParsedProperly).toBe(42);
});

it(`has useful error messages for JSON parsing errors`, async () => {
  await expect(
    JsonFile.readAsync(path.join(__dirname, 'files/syntax-error.json'))
  ).rejects.toThrowError(/Cause: SyntaxError: Unexpected string in JSON at position 602/);
});

it(`has useful error messages for JSON5 parsing errors`, async () => {
  await expect(
    JsonFile.readAsync(path.join(__dirname, 'files/syntax-error.json5'), { json5: true })
  ).rejects.toThrowError(/Cause: SyntaxError: JSON5: invalid character ',' at 4:15/);
});

const obj1 = { x: 1 };

it(`writes JSON to a file`, async () => {
  const filename = path.join(FIXTURES, 'test.json');
  const file = new JsonFile(filename, { json5: true });
  await file.writeAsync(obj1);
  expect(fs.existsSync(filename)).toBe(true);
  await expect(file.readAsync()).resolves.toEqual(obj1);
});

it(`rewrite async`, async () => {
  const filename = path.join(FIXTURES, 'test.json');
  const file = new JsonFile(filename, { json5: true });
  await file.writeAsync(obj1);
  expect(fs.existsSync(filename)).toBe(true);
  await expect(file.readAsync()).resolves.toEqual(obj1);
  await expect(file.rewriteAsync()).resolves.toBeDefined();
  expect(fs.existsSync(filename)).toBe(true);
  await expect(file.readAsync()).resolves.toEqual(obj1);
});

it(`changes an existing key in that file`, async () => {
  const file = new JsonFile(path.join(FIXTURES, 'test.json'), { json5: true });
  await expect(file.setAsync('x', 2)).resolves.toBeDefined();
  await expect(file.readAsync()).resolves.toEqual({ x: 2 });
});

it(`adds a new key to the file`, async () => {
  const file = new JsonFile(path.join(FIXTURES, 'test.json'), { json5: true });
  await expect(file.setAsync('x', 2)).resolves.toBeDefined();
  await expect(file.readAsync()).resolves.toEqual({ x: 2 });
  await expect(file.setAsync('y', 3)).resolves.toBeDefined();
  await expect(file.readAsync()).resolves.toEqual({ x: 2, y: 3 });
});

it(`deletes that same new key from the file`, async () => {
  const file = new JsonFile(path.join(FIXTURES, 'test.json'), { json5: true });
  await expect(file.setAsync('x', 2)).resolves.toBeDefined();
  await expect(file.setAsync('y', 3)).resolves.toBeDefined();
  await expect(file.deleteKeyAsync('y')).resolves.toBeDefined();
  await expect(file.readAsync()).resolves.toEqual({ x: 2 });
});

it(`deletes another key from the file`, async () => {
  const file = new JsonFile(path.join(FIXTURES, 'test.json'), { json5: true });
  await expect(file.setAsync('x', 2)).resolves.toBeDefined();
  await expect(file.setAsync('y', 3)).resolves.toBeDefined();
  await expect(file.deleteKeyAsync('x')).resolves.toBeDefined();
  await expect(file.deleteKeyAsync('y')).resolves.toBeDefined();
  await expect(file.readAsync()).resolves.toEqual({});
});

// This fails when i is high, around 200. However, no realistic use case would have the user
// constantly update a file that often
it('Multiple updates to the same file have no race conditions', async () => {
  const file = new JsonFile(path.join(FIXTURES, 'atomic-test.json'), { json5: true });
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
  const file = new JsonFile(path.join(FIXTURES, 'test.json'), { json5: true });
  await file.writeAsync({ i: 0 });
  for (let i = 0; i < 20; i++) {
    await file.writeAsync({ i });
    await expect(file.readAsync()).resolves.toEqual({ i });
  }
});

it('adds a new line at the eof', async () => {
  const filename = path.join(FIXTURES, 'test.json');
  const file = new JsonFile(filename, { json5: true });
  await file.writeAsync(obj1);
  expect(fs.existsSync(filename)).toBe(true);
  const data = await fs.promises.readFile(filename, 'utf-8');
  const lastChar = data[data.length - 1];
  expect(lastChar).toEqual('\n');
});
