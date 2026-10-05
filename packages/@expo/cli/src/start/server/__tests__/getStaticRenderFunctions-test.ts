import { evalModule } from '@expo/require-utils';

import { evalMetroNoHandling } from '../getStaticRenderFunctions';

jest.mock('@expo/require-utils', () => ({
  evalModule: jest.fn(() => ({})),
}));
jest.mock('../serverLogLikeMetro', () => ({
  augmentLogs: jest.fn(),
}));

const flatMap = {
  version: 3,
  sources: ['/app/a.ts', '/app/b.ts'],
  names: [],
  mappings: 'AAAA;ACAA',
};

function evaluatedSourceMap(): unknown {
  const options = jest.mocked(evalModule).mock.calls.at(-1)?.[2];
  return options?.sourceMap == null ? options?.sourceMap : JSON.parse(options.sourceMap);
}

beforeEach(() => {
  jest.mocked(evalModule).mockClear();
});

test('flattens an index source map before evaluating the bundle', () => {
  const indexMap = {
    version: 3,
    sections: [
      {
        offset: { line: 0, column: 0 },
        map: { version: 3, sources: ['/app/a.ts'], names: [], mappings: 'AAAA' },
      },
      {
        offset: { line: 1, column: 0 },
        map: { version: 3, sources: ['/app/b.ts'], names: [], mappings: 'AAAA' },
      },
    ],
  };
  evalMetroNoHandling('/app', 'a;\nb;', '/app/bundle.js', JSON.stringify(indexMap));
  expect(evaluatedSourceMap()).toMatchObject(flatMap);
});

test('passes a flat source map through unchanged', () => {
  evalMetroNoHandling('/app', 'a;\nb;', '/app/bundle.js', JSON.stringify(flatMap));
  expect(evaluatedSourceMap()).toEqual(flatMap);
});

test('evaluates without a source map', () => {
  evalMetroNoHandling('/app', 'a;', '/app/bundle.js');
  expect(evaluatedSourceMap()).toBeUndefined();
});
