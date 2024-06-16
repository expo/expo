import {
  ActionCrop,
  ActionExtent,
  ActionFlip,
  ActionResize,
  ActionRotate,
  FlipType,
  SaveFormat,
} from '../ImageManipulator.types';
import { validateUri, validateActions, validateSaveOptions } from '../validators';

describe(validateUri, () => {
  test('invalid', () => {
    expect(() => {
      validateUri(123 as unknown as string);
    }).toThrow(/must be a string/);
  });

  test('valid', () => {
    expect(() => {
      validateUri(
        'file:///data/user/0/dev.expo.payments/cache/ImagePicker/b6c466ef-60af-4957-b515-822689742770.jpg'
      );
    }).not.toThrow();
  });
});

describe(validateActions, () => {
  test('multiple transformations in single action', () => {
    expect(() => {
      const action = {
        flip: FlipType.Horizontal,
        rotate: 90,
      } as unknown as ActionFlip;
      validateActions([action]);
    }).toThrow();
  });

  describe('crop', () => {
    test('invalid', () => {
      expect(() => {
        const action = {
          crop: {
            originY: 10,
            width: true,
            height: 'blah',
          },
        } as unknown as ActionCrop;
        validateActions([action]);
      }).toThrow(/Crop action must be an object of shape/);
    });

    test('valid', () => {
      expect(() => {
        validateActions([
          {
            crop: {
              originX: 10,
              originY: 10,
              width: 100,
              height: 100,
            },
          },
        ]);
      }).not.toThrow();
    });
  });

  describe('extent', () => {
    test('invalid', () => {
      expect(() => {
        const action = {
          extent: {
            originY: 10,
            width: true,
            height: 'blah',
          },
        } as unknown as ActionExtent;
        validateActions([action]);
      }).toThrow(/Extent action must be an object of shape/);
    });

    test('valid', () => {
      expect(() => {
        validateActions([
          {
            extent: {
              originX: 10,
              originY: 10,
              width: 100,
              height: 100,
            },
          },
        ]);
      }).not.toThrow();
    });
  });

  describe('flip', () => {
    test('invalid', () => {
      expect(() => {
        const action = {
          flip: 'diagonal' as unknown as FlipType,
        } as unknown as ActionFlip;
        validateActions([action]);
      }).toThrow(/Unsupported flip type/);
    });

    test('valid', () => {
      expect(() => {
        validateActions([
          {
            flip: FlipType.Horizontal,
          },
        ]);
      }).not.toThrow();
    });
  });

  describe('rotate', () => {
    test('invalid', () => {
      expect(() => {
        const action = {
          rotate: true,
        } as unknown as ActionRotate;
        validateActions([action]);
      }).toThrow(/Rotation must be a number/);
    });

    test('valid', () => {
      expect(() => {
        validateActions([
          {
            rotate: 90,
          },
        ]);
      }).not.toThrow();
    });
  });

  describe('resize', () => {
    test('invalid', () => {
      expect(() => {
        const action = {
          resize: {
            width: '321',
            height: 123,
          },
        } as unknown as ActionResize;
        validateActions([action]);
      }).toThrow(/Resize action must be an object of shape/);
    });

    test('valid', () => {
      expect(() => {
        validateActions([
          {
            resize: {
              width: 123,
              height: 654,
            },
          },
        ]);
      }).not.toThrow();
      expect(() => {
        validateActions([
          {
            resize: {
              width: 123,
            },
          },
        ]);
      }).not.toThrow();

      expect(() => {
        validateActions([
          {
            resize: {
              height: 123,
            },
          },
        ]);
      }).not.toThrow();
    });
  });
});

describe(validateSaveOptions, () => {
  test('invalid "base64"', () => {
    expect(() => {
      const base64 = 123 as unknown as boolean;
      validateSaveOptions({ base64 });
    }).toThrow(/must be a boolean/);
  });

  test('invalid "compress"', () => {
    expect(() => {
      validateSaveOptions({ compress: 15 });
    }).toThrow(/must be a number between 0 and 1/);
  });

  test('invalid "format"', () => {
    expect(() => {
      const format = 'invalid' as SaveFormat;
      validateSaveOptions({ format });
    }).toThrow(/must be one of/);
  });

  test('valid', () => {
    expect(() => {
      validateSaveOptions({
        base64: true,
        compress: 0.5,
        format: SaveFormat.JPEG,
      });
    }).not.toThrow();
  });
});
