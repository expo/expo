import { createModuleIdFactory } from './fixtures/fromFixture';
import * as splitFixtures from './fixtures/basic-treeshaking';
import { simplifyGraph } from './fixtures/toFixture';
import { baseJSBundle } from '../fork/baseJSBundle';
import {
  getDefaultSerializer,
  withExpoSerializers,
  withSerializerPlugins,
} from '../withExpoSerializers';

// jest.mock('../fork/baseJSBundle', () => {
//   return {
//     baseJSBundle: jest.fn(jest.requireActual('../fork/baseJSBundle').baseJSBundle),
//   };
// });

function getSerializer() {
  return withExpoSerializers({}).serializer.customSerializer;
}

describe('tree-shaking', () => {
  beforeAll(() => {
    process.env.EXPO_USE_TREE_SHAKING = '1';
    jest.unmock('fs');
  });
  afterAll(() => {
    delete process.env.EXPO_USE_TREE_SHAKING;
    jest.mock('fs');
  });
  xit(`removes unused export`, async () => {
    const serializer = getSerializer();

    // Drop the pre-modules for brevity
    splitFixtures.basic[1] = [];

    // Serialize
    const stringResults = await serializer(...splitFixtures.basic);
    expect(typeof stringResults).toBe('string');

    console.log(stringResults);
    expect(stringResults).not.toMatch(/subtract/);
  });
  xit(`does not tree shake exports if cjs require is used`, async () => {
    const stringResults = await getSerializer()(...splitFixtures.staticCjs);
    console.log(stringResults);
    expect(stringResults).toMatch(/subtract/);
  });
  xit(`does not tree shake default exports`, async () => {
    const stringResults = await getSerializer()(...splitFixtures.defaultImport);
    console.log(stringResults);
    expect(stringResults).not.toMatch(/subtract/);
    expect(stringResults).toMatch(/a \+ b;/);
  });
  xit(`does not tree shake star imports`, async () => {
    const stringResults = await getSerializer()(...splitFixtures.starImport);
    console.log(stringResults);
    expect(stringResults).toMatch(/subtract/);
    expect(stringResults).toMatch(/a \+ b;/);
  });
  xit(`does not tree shake cjs re-exports`, async () => {
    const stringResults = await getSerializer()(...splitFixtures.getterReExport);
    console.log(stringResults);
    expect(stringResults).toMatch(/subtract/);
    expect(stringResults).toMatch(/a \+ b;/);
  });
  it(`does not tree shake barrel re-exports`, async () => {
    const stringResults = await getSerializer()(...splitFixtures.barrelExport);
    console.log(stringResults);
    expect(stringResults).toMatch(/subtract/);
    expect(stringResults).toMatch(/a \+ b;/);
  });
  xit(`works with larger projects`, async () => {
    splitFixtures.rnImport[1] = [];
    const stringResults = await getSerializer()(...splitFixtures.rnImport);
    console.log(stringResults);
    expect(stringResults).toMatch(/subtract/);
  });
  xit(`removes unused file`, async () => {
    const serializer = getSerializer();

    // Drop the pre-modules for brevity
    splitFixtures.unusedFile[1] = [];

    // Serialize
    const stringResults = await serializer(...splitFixtures.unusedFile);
    expect(typeof stringResults).toBe('string');

    console.log(stringResults);
    expect(stringResults).not.toMatch(/subtract/);
    expect(stringResults).not.toMatch(/unused/);
  });
});

xdescribe(withSerializerPlugins, () => {
  it(`executes in the expected order`, async () => {
    const customSerializer = jest.fn();

    const customProcessor = jest.fn((...res) => res);

    const config = withSerializerPlugins(
      {
        serializer: {
          customSerializer,
        },
      },
      [customProcessor as any]
    );

    const options = {
      sourceUrl: 'https://localhost:8081/index.bundle?platform=ios&dev=true&minify=false',
    };
    // @ts-expect-error
    await config.serializer.customSerializer('a', 'b', 'c', options);

    expect(customProcessor).toBeCalledWith('a', 'b', 'c', options);
    expect(customSerializer).toBeCalledWith('a', 'b', 'c', options);
  });
});
