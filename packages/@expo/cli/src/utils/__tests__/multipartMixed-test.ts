import {
  isMultipartPartWithName,
  parseMultipartMixedResponseAsync,
} from '@expo/multipart-body-parser';

import { encodeMultipartMixed } from '../multipartMixed';

describe(encodeMultipartMixed, () => {
  it('creates a parseable multipart/mixed body', async () => {
    const encoded = await encodeMultipartMixed([
      {
        name: 'a',
        value: 'test\na',
        contentType: 'text/plain',
      },
      {
        name: 'b',
        value: JSON.stringify({ json: 'value' }),
        contentType: 'application/json',
      },
    ]);

    const multipartParts = await parseMultipartMixedResponseAsync(
      `multipart/mixed; boundary=${encoded.boundary}`,
      Buffer.from(encoded.body)
    );

    expect(multipartParts).toEqual([
      {
        body: 'test\na',
        headers: new Map([
          ['content-disposition', `form-data; name="a"`],
          ['content-type', 'text/plain'],
        ]),
      },
      {
        body: '{"json":"value"}',
        headers: new Map([
          ['content-disposition', `form-data; name="b"`],
          ['content-type', 'application/json'],
        ]),
      },
    ]);

    expect(isMultipartPartWithName(multipartParts[0], 'a')).toBe(true);
    expect(isMultipartPartWithName(multipartParts[1], 'b')).toBe(true);
  });

  it('creates a parseable multipart/mixed body with custom part headers', async () => {
    const encoded = await encodeMultipartMixed([
      {
        name: 'a',
        value: 'test\na',
        partHeaders: {
          'expo-signature': 'signature',
        },
      },
    ]);

    const multipartParts = await parseMultipartMixedResponseAsync(
      `multipart/mixed; boundary=${encoded.boundary}`,
      Buffer.from(encoded.body)
    );

    expect(multipartParts).toEqual([
      {
        body: 'test\na',
        headers: new Map([
          ['content-disposition', `form-data; name="a"`],
          ['expo-signature', 'signature'],
        ]),
      },
    ]);

    expect(isMultipartPartWithName(multipartParts[0], 'a')).toBe(true);
  });

  it('accepts files', async () => {
    const encoded = await encodeMultipartMixed([
      {
        name: 'a',
        value: new File(['test\na'], 'a.txt', { type: 'text/plain' }),
      },
    ]);

    const multipartParts = await parseMultipartMixedResponseAsync(
      `multipart/mixed; boundary=${encoded.boundary}`,
      Buffer.from(encoded.body)
    );

    expect(multipartParts).toEqual([
      {
        body: 'test\na',
        headers: new Map([
          ['content-disposition', `form-data; name="a"; filename="a.txt"`],
          ['content-type', 'text/plain'],
        ]),
      },
    ]);

    expect(isMultipartPartWithName(multipartParts[0], 'a')).toBe(true);
  });
});
