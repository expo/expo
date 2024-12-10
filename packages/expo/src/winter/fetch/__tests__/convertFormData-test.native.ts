import RNFormData from 'react-native/Libraries/Network/FormData';
import { TextDecoder, TextEncoder } from 'util';

import { installFormDataPatch } from '../../FormData';
import { createBoundary, convertFormDataAsync, joinUint8Arrays } from '../convertFormData';

// @ts-ignore - TextDecoder and TextEncoder are not defined in native jest environments.
globalThis.TextDecoder ??= TextDecoder;
globalThis.TextEncoder ??= TextEncoder;

const ExpoFormData = installFormDataPatch(RNFormData);

describe(convertFormDataAsync, () => {
  it('should convert string', async () => {
    const formData = new ExpoFormData();
    formData.append('foo', 'foo');
    formData.append('bar', 'bar');
    const boundary = '----ExpoFetchFormBoundary0000000000000000';
    const { body, boundary: resultBoundary } = await convertFormDataAsync(formData, boundary);
    expect(new TextDecoder().decode(body)).toMatchInlineSnapshot(`
      "------ExpoFetchFormBoundary0000000000000000
      content-disposition: form-data; name="foo"

      foo
      ------ExpoFetchFormBoundary0000000000000000
      content-disposition: form-data; name="bar"

      bar
      ------ExpoFetchFormBoundary0000000000000000--
      "
    `);
    expect(resultBoundary).toBe(boundary);
  });

  it(`should convert blob`, async () => {
    const formData = new ExpoFormData();
    const blob = new Blob(['hello blob'], { type: 'text/plain' });
    formData.append('blob', blob, 'blobFile');
    const boundary = '----ExpoFetchFormBoundary0000000000000000';
    const { body, boundary: resultBoundary } = await convertFormDataAsync(formData, boundary);
    expect(new TextDecoder().decode(body)).toMatchInlineSnapshot(`
      "------ExpoFetchFormBoundary0000000000000000
      content-disposition: form-data; name="blob"; filename="blobFile"; filename*=utf-8''blobFile
      content-type: text/plain

      hello blob
      ------ExpoFetchFormBoundary0000000000000000--
      "
    `);
    expect(resultBoundary).toBe(boundary);
  });

  it(`should convert expo-file-system FileBlob`, async () => {
    const formData = new ExpoFormData();
    const mockFileBlob = {
      file: {
        bytes: () => new Uint8Array([65, 66, 67]),
      },
    };
    // @ts-ignore
    formData.append('blob', mockFileBlob);
    const boundary = '----ExpoFetchFormBoundary0000000000000000';
    const { body, boundary: resultBoundary } = await convertFormDataAsync(formData, boundary);
    expect(new TextDecoder().decode(body)).toMatchInlineSnapshot(`
      "------ExpoFetchFormBoundary0000000000000000
      content-disposition: form-data; name="blob"

      ABC
      ------ExpoFetchFormBoundary0000000000000000--
      "
    `);
    expect(resultBoundary).toBe(boundary);
  });

  it('should throw an error if the react-native FormData passing an uri', async () => {
    const formData = new ExpoFormData();
    formData.append('foo', {
      uri: 'file:/path/to/test.jpg',
      type: 'image/jpeg',
      name: 'test.jpg',
    });
    expect(convertFormDataAsync(formData)).rejects.toThrow(
      /Unsupported FormDataPart implementation/
    );
  });
});

describe(createBoundary, () => {
  it('should return a boundary string with ExpoFetchFormBoundary prefix plus 16 random chars', () => {
    expect(createBoundary()).toMatch(/^----ExpoFetchFormBoundary[\w]{16}$/);
  });
});

describe(joinUint8Arrays, () => {
  it(`should join multiple uint8 arrays`, () => {
    const array1 = new Uint8Array([1, 2]);
    const array2 = new Uint8Array([3, 4]);
    const result = joinUint8Arrays([array1, array2]);
    const expected = new Uint8Array([1, 2, 3, 4]);
    expect(result).toEqual(expected);
  });

  it(`should join 0 size arrays correctly`, () => {
    const array1 = new Uint8Array([1, 2]);
    const array2 = new Uint8Array([]);
    const array3 = new Uint8Array([3, 4]);
    const result = joinUint8Arrays([array1, array2, array3]);
    const expected = new Uint8Array([1, 2, 3, 4]);
    expect(result).toEqual(expected);
  });
});
