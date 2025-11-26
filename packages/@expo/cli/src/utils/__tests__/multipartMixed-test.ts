import { parseMultipart } from 'multitars';

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

    const multipartParts: { body: string; name: string; type: string }[] = [];
    const contentType = `multipart/mixed; boundary=${encoded.boundary}`;
    for await (const part of parseMultipart(new Blob([encoded.body]).stream(), { contentType })) {
      multipartParts.push({
        name: part.name,
        type: part.type,
        body: await part.text(),
      });
    }

    expect(multipartParts).toEqual([
      {
        body: 'test\na',
        name: 'a',
        type: 'text/plain',
      },
      {
        body: '{"json":"value"}',
        name: 'b',
        type: 'application/json',
      },
    ]);
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

    const contentType = `multipart/mixed; boundary=${encoded.boundary}`;
    for await (const part of parseMultipart(new Blob([encoded.body]).stream(), { contentType })) {
      expect(part.headers['expo-signature']).toBe('signature');
    }
  });

  it('accepts files', async () => {
    const encoded = await encodeMultipartMixed([
      {
        name: 'a',
        value: new File(['test\na'], 'a.txt', { type: 'text/plain' }),
      },
    ]);

    const contentType = `multipart/mixed; boundary=${encoded.boundary}`;
    for await (const part of parseMultipart(new Blob([encoded.body]).stream(), { contentType })) {
      expect(await part.text()).toBe('test\na');
    }
  });
});
