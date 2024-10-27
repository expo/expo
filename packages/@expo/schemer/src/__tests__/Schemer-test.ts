import Schemer from '..';
import { ErrorCodes, SchemerError } from '../Error';
import good from './fixtures/app.json';
import bad from './fixtures/bad.json';
import badWithNot from './fixtures/badwithnot.json';
import invalidAppIcon from './fixtures/invalidAppIcon.json';
import schema from './fixtures/schema.json';

const validator = new Schemer(schema.schema, { rootDir: __dirname });

describe('Sanity Tests', () => {
  it('returns instance of Schemer', () => {
    expect(validator instanceof Schemer).toBe(true);
  });

  it('returns instance with public functions', () => {
    expect(validator).toMatchObject({
      validateAll: expect.any(Function),
      validateProperty: expect.any(Function),
    });
  });
});

describe('Image Validation', () => {
  it('errors for webp images', async () => {
    const error = await expectSchemerToThrowAsync(() =>
      validator.validateAssetsAsync({
        android: {
          adaptiveIcon: { foregroundImage: './fixtures/webp.webp' },
        },
      })
    );

    expect(error.errors).toEqual([
      expect.objectContaining({ errorCode: ErrorCodes.INVALID_CONTENT_TYPE }),
      expect.objectContaining({ errorCode: ErrorCodes.NOT_SQUARE }),
    ]);
    expectSchemerErrorToMatchSnapshot(error);
  });

  it('errors when file extension and content do not match up', async () => {
    const error = await expectSchemerToThrowAsync(() =>
      validator.validateAssetsAsync({
        icon: './fixtures/secretlyPng.jpg',
      })
    );

    expect(error.errors).toEqual([
      expect.objectContaining({ errorCode: ErrorCodes.FILE_EXTENSION_MISMATCH }),
    ]);
    expectSchemerErrorToMatchSnapshot(error);
  });
});

describe('Holistic Unit Test', () => {
  it('good example app.json all', async () => {
    expect(await validator.validateAll(good)).toBeUndefined();
  });

  it('good example app.json schema', async () => {
    expect(await validator.validateSchemaAsync(good)).toBeUndefined();
  });

  it('bad example app.json schema', async () => {
    expectSchemerErrorToMatchSnapshot(
      await expectSchemerToThrowAsync(() => validator.validateSchemaAsync(bad))
    );
  });

  it('bad example app.json schema with field with not', async () => {
    expectSchemerErrorToMatchSnapshot(
      await expectSchemerToThrowAsync(() => validator.validateSchemaAsync(badWithNot))
    );
  });

  it('bad example app.json - invalid path for app icon', async () => {
    expectSchemerErrorToMatchSnapshot(
      await expectSchemerToThrowAsync(() => validator.validateAll(invalidAppIcon))
    );
  });
});

describe('Manual Validation Individual Unit Tests', () => {
  it('Local Icon', async () => {
    expect(await validator.validateIcon('./fixtures/check.png')).toBeUndefined();
  });

  it('Local Square Icon correct', async () => {
    const customValidator = new Schemer(
      { properties: { icon: { meta: { asset: true, square: true } } } },
      { rootDir: __dirname }
    );
    expect(await customValidator.validateIcon('./fixtures/check.png')).toBeUndefined();
  });

  it('Local icon dimensions wrong', async () => {
    const customValidator = new Schemer(
      {
        properties: {
          icon: {
            meta: {
              asset: true,
              dimensions: { width: 400, height: 401 },
              contentTypePattern: '^image/png$',
            },
          },
        },
      },
      { rootDir: __dirname }
    );
    const error = await expectSchemerToThrowAsync(() =>
      customValidator.validateIcon('./fixtures/check.png')
    );

    expect(error.errors).toHaveLength(1);
    expectSchemerErrorToMatchSnapshot(error);
  });
});

describe('Individual Unit Tests', () => {
  it('Error when missing Required Property', async () => {
    const customValidator = new Schemer(
      {
        properties: { name: {} },
        required: ['name'],
      },
      { rootDir: __dirname }
    );
    const error = await expectSchemerToThrowAsync(() =>
      customValidator.validateAll({ noName: '' })
    );

    expect(error.errors).toHaveLength(1);
    expect(error.errors).toEqual([
      expect.objectContaining({ errorCode: ErrorCodes.SCHEMA_MISSING_REQUIRED_PROPERTY }),
    ]);
    expectSchemerErrorToMatchSnapshot(error);
  });

  it('Error when data has an additional property', async () => {
    const customValidator = new Schemer({ additionalProperties: false }, { rootDir: __dirname });

    const error = await expectSchemerToThrowAsync(() =>
      customValidator.validateAll({ extraProperty: 'extra' })
    );

    expect(error.errors).toHaveLength(1);
    expect(error.errors).toEqual([
      expect.objectContaining({ errorCode: ErrorCodes.SCHEMA_ADDITIONAL_PROPERTY }),
    ]);
    expectSchemerErrorToMatchSnapshot(error);
  });

  it.each`
    name            | expectedError
    ${'wilson'}     | ${undefined}
    ${[1, 2, 3, 4]} | ${'must be string'}
    ${23.232332}    | ${'must be string'}
    ${/regex.*/}    | ${'must be string'}
  `('validates name: $name', async ({ name, expectedError }) => {
    if (!expectedError) {
      expect(await validator.validateName(name)).toBeUndefined();
    } else {
      const error = await expectSchemerToThrowAsync(() => validator.validateName(name));
      expect(error.message).toBe(expectedError);
    }
  });

  it.each`
    slug                                             | expectedError
    ${'wilson'}                                      | ${undefined}
    ${12312123123}                                   | ${'must be string'}
    ${[1, 23]}                                       | ${'must be string'}
    ${'wilson123'}                                   | ${undefined}
    ${'wilson-123'}                                  | ${undefined}
    ${'wilson/test'}                                 | ${'\'\' must match pattern "^[a-zA-Z0-9_\\-]+$"'}
    ${'wilson-test%'}                                | ${'\'\' must match pattern "^[a-zA-Z0-9_\\-]+$"'}
    ${'wilson-test-zhao--javascript-is-super-funky'} | ${undefined}
  `('validates slug: $slug', async ({ slug, expectedError }) => {
    if (!expectedError) {
      expect(await validator.validateSlug(slug)).toBeUndefined();
    } else {
      const error = await expectSchemerToThrowAsync(() => validator.validateSlug(slug));
      expect(error.message).toBe(expectedError);
    }
  });

  it.each`
    sdkVersion       | expectedError
    ${'1.0.0'}       | ${undefined}
    ${'2.0.0.0.1'}   | ${undefined}
    ${'UNVERSIONED'} | ${undefined}
    ${'12.2a.3'}     | ${'\'\' must match pattern "^(\\d+\\.\\d+\\.\\d+)|(UNVERSIONED)$"'}
    ${'9,9,9'}       | ${'\'\' must match pattern "^(\\d+\\.\\d+\\.\\d+)|(UNVERSIONED)$"'}
    ${'1.2'}         | ${'\'\' must match pattern "^(\\d+\\.\\d+\\.\\d+)|(UNVERSIONED)$"'}
  `('validates SDK version: $sdkVersion', async ({ sdkVersion, expectedError }) => {
    if (!expectedError) {
      expect(await validator.validateSdkVersion(sdkVersion)).toBeUndefined();
    } else {
      const error = await expectSchemerToThrowAsync(() => validator.validateSdkVersion(sdkVersion));
      expect(error.message).toBe(expectedError);
    }
  });
});

async function expectSchemerToThrowAsync(action: () => any): Promise<SchemerError> {
  try {
    await action();
  } catch (error: any) {
    expect(error).toBeInstanceOf(SchemerError);
    return error;
  }

  throw new Error('Expression did not throw the expected error');
}

function expectSchemerErrorToMatchSnapshot(error: SchemerError) {
  expect(
    error.errors.map((validationError) => {
      const { stack, message, ...rest } = validationError;
      return { ...rest, message };
    })
  ).toMatchSnapshot();
}
