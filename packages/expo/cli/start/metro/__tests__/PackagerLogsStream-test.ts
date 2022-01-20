import stripAnsi from 'strip-ansi';

import PackagerLogsStream from '../PackagerLogsStream';

jest.mock('../../internal', () => {
  const internal = jest.requireActual('../../internal');

  return {
    ...internal,
    ProjectUtils: {
      attachLoggerStream: jest.fn(),
    },
  };
});

function createBundlingErrorChunk(error): any {
  return {
    // @ts-ignore
    hostname: 'Evans-MacBook-Pro.local',
    pid: 86582,
    type: 'project',
    project: '/app',
    level: 30,
    tag: 'metro',
    msg: {
      error,
      type: 'bundling_error',
    },
    time: new Date('2021-10-18T20:06:02.209Z'),
    id: 'd1809510-304e-11ec-9b2e-5d348245f90d',
    v: 0,
  };
}

describe(PackagerLogsStream, () => {
  it(`formats a Metro internal error`, () => {
    const streamer = new PackagerLogsStream({
      getSnippetForError: jest.fn(() => {
        return '';
      }),
      updateLogs: jest.fn(),
    } as any);

    streamer._handleChunk(
      createBundlingErrorChunk({
        type: 'TransformError',
        lineNumber: 0,
        errors: [
          {
            description:
              "node_modules/react-native/Libraries/NewAppScreen/components/logo.png: Cannot read property 'length' of undefined",
            lineNumber: 0,
          },
        ],
        name: 'SyntaxError',
        message:
          "node_modules/react-native/Libraries/NewAppScreen/components/logo.png: Cannot read property 'length' of undefined",
        stack:
          "TypeError: Cannot read property 'length' of undefined\n" +
          '    at applyAssetDataPlugins (/app/node_modules/metro/src/Assets.js:182:25)\n' +
          '    at getAssetData (/app/node_modules/metro/src/Assets.js:178:16)\n' +
          '    at async Object.transform (/app/node_modules/metro-transform-worker/src/utils/assetTransformer.js:30:16)\n' +
          '    at async transformAsset (/app/node_modules/metro-transform-worker/src/index.js:371:18)\n' +
          '    at async Object.transform (/app/node_modules/metro-transform-worker/src/index.js:559:14)',
      })
    );

    expect(streamer._getSnippetForError).toHaveBeenCalledWith({
      errors: [
        {
          description:
            "node_modules/react-native/Libraries/NewAppScreen/components/logo.png: Cannot read property 'length' of undefined",
          lineNumber: 0,
        },
      ],
      lineNumber: 0,
      message:
        "node_modules/react-native/Libraries/NewAppScreen/components/logo.png: Cannot read property 'length' of undefined",
      name: 'SyntaxError',
      stack: expect.stringMatching(/at applyAssetDataPlugins/),
      //    `TypeError: Cannot read property 'length' of undefined
      //              at applyAssetDataPlugins (/app/node_modules/metro/src/Assets.js:182:25)
      //              at getAssetData (/app/node_modules/metro/src/Assets.js:178:16)
      //              at async Object.transform (/app/node_modules/metro-transform-worker/src/utils/assetTransformer.js:30:16)
      //              at async transformAsset (/app/node_modules/metro-transform-worker/src/index.js:371:18)
      //              at async Object.transform (/app/node_modules/metro-transform-worker/src/index.js:559:14)`,
      type: 'TransformError',
    });

    const msg = stripAnsi(streamer._logsToAdd[0].msg);

    expect(streamer._logsToAdd.length).toBe(1);
    // Since the message has formatting, use a snapshot to keep it in an expected format.
    expect(msg).toMatchSnapshot();
    // Title is expected.
    expect(msg).toMatch(
      /node_modules\/react-native\/Libraries\/NewAppScreen\/components\/logo.png: Cannot read property 'length' of undefined/
    );
    // Stack trace is added.
    expect(msg).toMatch(
      /at applyAssetDataPlugins \(\/app\/node_modules\/metro\/src\/Assets\.js:182:25\)/
    );
  });
  it(`formats an application code syntax error`, () => {
    const streamer = new PackagerLogsStream({
      updateLogs: jest.fn(),
    } as any);

    streamer._handleChunk(
      createBundlingErrorChunk({
        type: 'TransformError',
        lineNumber: 5,
        column: 0,
        filename: 'App.js',
        errors: [
          {
            description:
              'SyntaxError: /app/App.js: Unexpected token (5:0)\n' +
              '\n' +
              "\x1B[0m \x1B[90m 3 |\x1B[39m \x1B[36mimport\x1B[39m { \x1B[33mStyleSheet\x1B[39m\x1B[33m,\x1B[39m \x1B[33mText\x1B[39m\x1B[33m,\x1B[39m \x1B[33mView\x1B[39m } \x1B[36mfrom\x1B[39m \x1B[32m'react-native'\x1B[39m\x1B[33m;\x1B[39m\x1B[0m\n" +
              '\x1B[0m \x1B[90m 4 |\x1B[39m\x1B[0m\n' +
              '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 5 |\x1B[39m \x1B[33m>\x1B[39m\x1B[0m\n' +
              '\x1B[0m \x1B[90m   |\x1B[39m \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
              '\x1B[0m \x1B[90m 6 |\x1B[39m \x1B[36mexport\x1B[39m \x1B[36mdefault\x1B[39m \x1B[36mfunction\x1B[39m \x1B[33mApp\x1B[39m() {\x1B[0m\n' +
              '\x1B[0m \x1B[90m 7 |\x1B[39m   \x1B[36mreturn\x1B[39m (\x1B[0m\n' +
              '\x1B[0m \x1B[90m 8 |\x1B[39m     \x1B[33m<\x1B[39m\x1B[33mView\x1B[39m style\x1B[33m=\x1B[39m{styles\x1B[33m.\x1B[39mcontainer}\x1B[33m>\x1B[39m\x1B[0m',
            filename: 'App.js',
            lineNumber: 5,
          },
        ],
        name: 'SyntaxError',
        message:
          'SyntaxError: /app/App.js: Unexpected token (5:0)\n' +
          '\n' +
          "\x1B[0m \x1B[90m 3 |\x1B[39m \x1B[36mimport\x1B[39m { \x1B[33mStyleSheet\x1B[39m\x1B[33m,\x1B[39m \x1B[33mText\x1B[39m\x1B[33m,\x1B[39m \x1B[33mView\x1B[39m } \x1B[36mfrom\x1B[39m \x1B[32m'react-native'\x1B[39m\x1B[33m;\x1B[39m\x1B[0m\n" +
          '\x1B[0m \x1B[90m 4 |\x1B[39m\x1B[0m\n' +
          '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 5 |\x1B[39m \x1B[33m>\x1B[39m\x1B[0m\n' +
          '\x1B[0m \x1B[90m   |\x1B[39m \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
          '\x1B[0m \x1B[90m 6 |\x1B[39m \x1B[36mexport\x1B[39m \x1B[36mdefault\x1B[39m \x1B[36mfunction\x1B[39m \x1B[33mApp\x1B[39m() {\x1B[0m\n' +
          '\x1B[0m \x1B[90m 7 |\x1B[39m   \x1B[36mreturn\x1B[39m (\x1B[0m\n' +
          '\x1B[0m \x1B[90m 8 |\x1B[39m     \x1B[33m<\x1B[39m\x1B[33mView\x1B[39m style\x1B[33m=\x1B[39m{styles\x1B[33m.\x1B[39mcontainer}\x1B[33m>\x1B[39m\x1B[0m',
        stack:
          'SyntaxError: /app/App.js: Unexpected token (5:0)\n' +
          '\n' +
          "\x1B[0m \x1B[90m 3 |\x1B[39m \x1B[36mimport\x1B[39m { \x1B[33mStyleSheet\x1B[39m\x1B[33m,\x1B[39m \x1B[33mText\x1B[39m\x1B[33m,\x1B[39m \x1B[33mView\x1B[39m } \x1B[36mfrom\x1B[39m \x1B[32m'react-native'\x1B[39m\x1B[33m;\x1B[39m\x1B[0m\n" +
          '\x1B[0m \x1B[90m 4 |\x1B[39m\x1B[0m\n' +
          '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 5 |\x1B[39m \x1B[33m>\x1B[39m\x1B[0m\n' +
          '\x1B[0m \x1B[90m   |\x1B[39m \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
          '\x1B[0m \x1B[90m 6 |\x1B[39m \x1B[36mexport\x1B[39m \x1B[36mdefault\x1B[39m \x1B[36mfunction\x1B[39m \x1B[33mApp\x1B[39m() {\x1B[0m\n' +
          '\x1B[0m \x1B[90m 7 |\x1B[39m   \x1B[36mreturn\x1B[39m (\x1B[0m\n' +
          '\x1B[0m \x1B[90m 8 |\x1B[39m     \x1B[33m<\x1B[39m\x1B[33mView\x1B[39m style\x1B[33m=\x1B[39m{styles\x1B[33m.\x1B[39mcontainer}\x1B[33m>\x1B[39m\x1B[0m\n' +
          '    at Object._raise (/app/node_modules/@babel/parser/lib/index.js:541:17)\n' +
          '    at Object.raiseWithData (/app/node_modules/@babel/parser/lib/index.js:534:17)\n' +
          '    at Object.raise (/app/node_modules/@babel/parser/lib/index.js:495:17)\n' +
          '    at Object.unexpected (/app/node_modules/@babel/parser/lib/index.js:3550:16)\n' +
          '    at Object.parseExprAtom (/app/node_modules/@babel/parser/lib/index.js:11857:22)\n' +
          '    at Object.parseExprAtom (/app/node_modules/@babel/parser/lib/index.js:7456:20)\n' +
          '    at Object.parseExprSubscripts (/app/node_modules/@babel/parser/lib/index.js:11414:23)\n' +
          '    at Object.parseUpdate (/app/node_modules/@babel/parser/lib/index.js:11394:21)\n' +
          '    at Object.parseMaybeUnary (/app/node_modules/@babel/parser/lib/index.js:11369:23)\n' +
          '    at Object.parseMaybeUnaryOrPrivate (/app/node_modules/@babel/parser/lib/index.js:11183:61)',
      })
    );

    const msg = stripAnsi(streamer._logsToAdd[0].msg);

    expect(streamer._logsToAdd.length).toBe(1);
    // Since the message has formatting, use a snapshot to keep it in an expected format.
    expect(msg).toMatchSnapshot();
    // Title is expected.
    expect(msg).toMatch(/SyntaxError: \/app\/App.js: Unexpected token \(5:0\)/);
  });
});
