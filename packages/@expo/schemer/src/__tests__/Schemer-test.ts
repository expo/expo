import { JSONSchema } from '@expo/schema-utils';

import Schemer from '..';
import { ErrorCodes, SchemerError } from '../Error';
import good from './fixtures/app.json';
import bad from './fixtures/bad.json';
import badWithNot from './fixtures/badwithnot.json';
import invalidAppIcon from './fixtures/invalidAppIcon.json';
import schema from './fixtures/schema.json';

const validator = new Schemer(schema.schema as unknown as JSONSchema, { rootDir: __dirname });

describe('Sanity Tests', () => {
  it('returns instance of Schemer', () => {
    expect(validator instanceof Schemer).toBe(true);
  });

  it('returns instance with public functions', () => {
    expect(validator).toMatchObject({
      validateAll: expect.any(Function),
      validateSchemaAsync: expect.any(Function),
      validateAssetsAsync: expect.any(Function),
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
    expect(await validator.validateAssetsAsync({ icon: './fixtures/check.png' })).toBeUndefined();
  });

  it('Local Square Icon correct', async () => {
    const customValidator = new Schemer(
      { properties: { icon: { meta: { asset: true, square: true } } } },
      { rootDir: __dirname }
    );
    expect(
      await customValidator.validateAssetsAsync({ icon: './fixtures/check.png' })
    ).toBeUndefined();
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
      customValidator.validateAssetsAsync({ icon: './fixtures/check.png' })
    );

    expect(error.errors).toHaveLength(1);
    expectSchemerErrorToMatchSnapshot(error);
  });

  it('iOS .icon directory successful validation', async () => {
    const customValidator = new Schemer(
      {
        properties: {
          icon: {
            meta: {
              asset: true,
              contentTypePattern: 'directory',
              contentTypeHuman: '.icon directory',
            },
          },
        },
      },
      { rootDir: __dirname }
    );
    expect(
      await customValidator.validateAssetsAsync({ icon: './fixtures/test.icon' })
    ).toBeUndefined();
  });

  it('iOS .icon directory fails validation - does not exist', async () => {
    const customValidator = new Schemer(
      {
        properties: {
          icon: {
            meta: {
              asset: true,
              contentTypePattern: 'directory',
              contentTypeHuman: '.icon directory',
            },
          },
        },
      },
      { rootDir: __dirname }
    );
    const error = await expectSchemerToThrowAsync(() =>
      customValidator.validateAssetsAsync({ icon: './fixtures/nonexistent.icon' })
    );

    expect(error.errors).toHaveLength(1);
    expect(error.errors[0]).toEqual(
      expect.objectContaining({
        errorCode: ErrorCodes.INVALID_ASSET_URI,
        message: "directory does not exist at './fixtures/nonexistent.icon'",
      })
    );
  });

  it('iOS .icon directory fails validation - not a directory', async () => {
    const customValidator = new Schemer(
      {
        properties: {
          icon: {
            meta: {
              asset: true,
              contentTypePattern: 'directory',
              contentTypeHuman: '.icon directory',
            },
          },
        },
      },
      { rootDir: __dirname }
    );
    const error = await expectSchemerToThrowAsync(() =>
      customValidator.validateAssetsAsync({ icon: './fixtures/check.png' })
    );

    expect(error.errors).toHaveLength(1);
    expect(error.errors[0]).toEqual(
      expect.objectContaining({
        errorCode: ErrorCodes.INVALID_CONTENT_TYPE,
        message:
          "field 'icon' should point to .icon directory but the path at './fixtures/check.png' is not a directory",
      })
    );
  });
  describe('ios.icon in the SDK 58 app config schema', () => {
    // `ios.icon` is a `oneOf`: a `.icon` directory, any other string as a PNG,
    // or an object of light/dark/tinted PNGs. Each value must be checked
    // against its own branch only.
    const iconValidator = new Schemer(require('./fixtures/ios-icon-schema.json'), {
      rootDir: __dirname,
    });

    it('checks a .icon directory only as a directory', async () => {
      expect(
        await iconValidator.validateAssetsAsync({ ios: { icon: './fixtures/test.icon' } })
      ).toBeUndefined();
    });

    it('checks a .png only as an image', async () => {
      expect(
        await iconValidator.validateAssetsAsync({ ios: { icon: './fixtures/check.png' } })
      ).toBeUndefined();
    });

    it('reports a missing .icon directory', async () => {
      const error = await expectSchemerToThrowAsync(() =>
        iconValidator.validateAssetsAsync({ ios: { icon: './fixtures/nonexistent.icon' } })
      );
      expect(error.errors).toEqual([
        expect.objectContaining({
          errorCode: ErrorCodes.INVALID_ASSET_URI,
          message: "directory does not exist at './fixtures/nonexistent.icon'",
        }),
      ]);
    });

    it('checks each image of the object form', async () => {
      // The string branches used to receive the object too, and
      // `path.resolve(rootDir, object)` threw a TypeError out of the scan.
      const error = await expectSchemerToThrowAsync(() =>
        iconValidator.validateAssetsAsync({
          ios: { icon: { light: './fixtures/check.png', dark: './fixtures/nonexistent.png' } },
        })
      );
      expect(error.errors).toEqual([
        expect.objectContaining({
          errorCode: ErrorCodes.INVALID_ASSET_URI,
          fieldPath: 'ios.icon.dark',
          message: "cannot access file at './fixtures/nonexistent.png'",
        }),
      ]);
    });
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
