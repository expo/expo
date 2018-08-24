import React from 'react';
import { Constants } from 'expo-constants';
import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';
import TestRenderer from 'react-test-renderer';

import LogSerialization from '../LogSerialization';

jest.mock('react-native/Libraries/Core/Devtools/symbolicateStackTrace', () =>
  jest.fn(
    async stack =>
      // We don't test symbolication itself in this test, partly because it's complex
      stack
  )
);

jest.mock('expo-constants', () => ({
  Constants: {
    manifest: {
      developer: {
        projectRoot: '/home/test/project',
      },
    },
  },
}));

it(`serializes simple log messages`, async () => {
  let result = await LogSerialization.serializeLogDataAsync(
    ['hi', 1, true, 0, '', null, false, undefined],
    'info'
  );
  expect(result.body).toEqual(['hi', '1', 'true', '0', '', 'null', 'false', 'undefined']);
  expect(result.includesStack).toBeFalsy();
});

it(`serializes nested objects`, async () => {
  let result = await LogSerialization.serializeLogDataAsync(
    [{ outer: { inner: [[], {}] } }],
    'info'
  );
  expect(result.body).toMatchSnapshot();
  expect(result.includesStack).toBeFalsy();
});

it(`serializes functions`, async () => {
  let result = await LogSerialization.serializeLogDataAsync([function test() {}, () => {}], 'info');
  expect(result.body).toEqual(['[Function test]', '[Function anonymous]']);
  expect(result.includesStack).toBeFalsy();
});

it(`serializes symbols`, async () => {
  let result = await LogSerialization.serializeLogDataAsync(
    [Symbol('test'), Symbol.iterator],
    'info'
  );
  expect(result.body).toEqual(['Symbol(test)', 'Symbol(Symbol.iterator)']);
  expect(result.includesStack).toBeFalsy();
});

it(`serializes promises`, async () => {
  let result = await LogSerialization.serializeLogDataAsync(
    [Promise.resolve('test'), Promise.reject(new Error('Expected'))],
    'info'
  );
  expect(result.body.length).toBe(2);
  expect(result.body[0]).toMatch('Promise');
  expect(result.body[1]).toMatch('Promise');
  expect(result.includesStack).toBeFalsy();
});

it(`serializes React elements`, async () => {
  class TestComponent extends React.Component {}

  let result = await LogSerialization.serializeLogDataAsync([<TestComponent />], 'info');
  expect(Array.isArray(result.body)).toBe(true);
  expect(result.includesStack).toBeFalsy();
});

it(`serializes React components (refs)`, async () => {
  class TestComponent extends React.Component {
    render() {
      return <ChildComponent ref={component => (this.child = component)} />;
    }
  }
  class ChildComponent extends React.Component {
    render() {
      return 'test';
    }
  }

  let testRenderer = TestRenderer.create(<TestComponent />);
  let result = await LogSerialization.serializeLogDataAsync(
    [testRenderer.root.instance.child],
    'info'
  );
  expect(Array.isArray(result.body)).toBe(true);
  expect(result.body[0]).toMatch('ChildComponent');
  expect(result.includesStack).toBeFalsy();
});

describe('with stack trace support in XDL', () => {
  it(`includes a symbolicated stack trace when logging an error`, async () => {
    let mockError = _getMockError('Test error');
    let result = await LogSerialization.serializeLogDataAsync([mockError], 'info');
    expect(symbolicateStackTrace).toHaveBeenCalledTimes(1);

    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].message).toBe('Test error');
    expect(result.body[0].stack).toMatchSnapshot();
    expect(result.includesStack).toBe(true);
  });

  it(`can symbolicate errors from V8`, async () => {
    let mockError = _getMockV8Error('Test error');
    let result = await LogSerialization.serializeLogDataAsync([mockError], 'info');
    expect(symbolicateStackTrace).toHaveBeenCalledTimes(1);

    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].message).toBe('Test error');
    expect(result.body[0].stack).toMatch('_exampleFunction');
    expect(result.includesStack).toBe(true);
  });

  it(`includes a symbolicated stack trace when warning`, async () => {
    let result = await LogSerialization.serializeLogDataAsync(['warning message'], 'warn');
    expect(symbolicateStackTrace).toHaveBeenCalledTimes(1);

    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].message).toBe('warning message');
    expect(result.body[0].stack).toBeDefined();
    expect(result.includesStack).toBe(true);
  });

  it(`includes a symbolicated stack trace when erroring`, async () => {
    let result = await LogSerialization.serializeLogDataAsync(['error message'], 'error');
    expect(symbolicateStackTrace).toHaveBeenCalledTimes(1);

    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].message).toBe('error message');
    expect(result.body[0].stack).toBeDefined();
    expect(result.includesStack).toBe(true);
  });

  it(`uses the provided error's stack trace when erroring`, async () => {
    let mockError = _getMockError('Test error');
    let result = await LogSerialization.serializeLogDataAsync([mockError], 'error');
    expect(symbolicateStackTrace).toHaveBeenCalledTimes(1);

    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].message).toBe('Test error');
    expect(result.body[0].stack).toMatch('_exampleFunction');
  });

  it(`symbolicates unhandled promise rejections`, async () => {
    let warningMessage = _getMockUnhandledPromiseRejection();
    let result = await LogSerialization.serializeLogDataAsync([warningMessage], 'warn');
    expect(symbolicateStackTrace).toHaveBeenCalledTimes(1);

    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].message).toMatch('Unhandled promise rejection: ');
    expect(result.body[0].stack).toBeDefined();
    expect(result.includesStack).toBe(true);
  });

  it(`doesn't fail if the error has no stack frames`, async () => {
    let mockError = new Error('Test error');
    mockError.stack = mockError.stack.split('\n')[0];

    let result = await LogSerialization.serializeLogDataAsync([mockError], 'info');
    expect(result).toMatchSnapshot();
  });

  it(`doesn't fail if the error stack property is missing`, async () => {
    let mockError = new Error('Test error');
    mockError.stack = undefined;

    let result = await LogSerialization.serializeLogDataAsync([mockError], 'info');
    expect(result).toMatchSnapshot();
  });

  it(`doesn't fail if symbolication fails`, async () => {
    symbolicateStackTrace.mockImplementationOnce(async () => {
      throw new Error('Intentional symbolication error');
    });

    let mockError = _getMockError('Test error');
    let result = await LogSerialization.serializeLogDataAsync([mockError], 'error');
    expect(symbolicateStackTrace).toHaveBeenCalledTimes(1);

    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].message).toBe('Test error');
    expect(result.body[0].stack).toMatchSnapshot();
    expect(result.includesStack).toBe(true);
  });
});

describe(`without stack trace support in XDL`, () => {
  let originalProjectRoot;

  beforeAll(() => {
    originalProjectRoot = Constants.manifest.developer.projectRoot;
    delete Constants.manifest.developer.projectRoot;
  });

  afterAll(() => {
    Constants.manifest.developer.projectRoot = originalProjectRoot;
  });

  it(`doesn't capture a stack trace`, async () => {
    let result = await LogSerialization.serializeLogDataAsync(['oh no'], 'error');
    expect(result.includesStack).toBeFalsy();
    expect(symbolicateStackTrace).not.toHaveBeenCalled();
  });
});

function _getMockError(message) {
  let error = new Error(message);
  error.stack = `_exampleFunction@/home/test/project/App.js:125:13
_depRunCallbacks@/home/test/project/node_modules/dep/index.js:77:45
tryCallTwo@/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js:45:5
doResolve@/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js:200:13`;
  return error;
}

function _getMockV8Error(message) {
  let error = new Error(message);
  let mockStack = `
  at _exampleFunction (/home/test/project/App.js:125:13)
  at _depRunCallbacks (/home/test/project/node_modules/dep/index.js:77:45)
  at tryCallTwo (/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js:45:5)
  at doResolve (/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js:200:13)`;
  error.stack = error.stack.split('\n')[0] + mockStack;
  return error;
}

function _getMockUnhandledPromiseRejection() {
  return `Possible Unhandled Promise Rejection (id: 0):
Error: Intentionally unhandled async error
_callee$@http://localhost:19001/entry.bundle?platform=ios&dev=true&strict=false&minify=false&hot=false&assetPlugin=/home/test/project/node_modules/expo/tools/hashAssetFiles:99344:32
tryCatch@http://localhost:19001/entry.bundle?platform=ios&dev=true&strict=false&minify=false&hot=false&assetPlugin=/home/test/project/node_modules/expo/tools/hashAssetFiles:12301:44
invoke@http://localhost:19001/entry.bundle?platform=ios&dev=true&strict=false&minify=false&hot=false&assetPlugin=/home/test/project/node_modules/expo/tools/hashAssetFiles:12489:30`;
}
