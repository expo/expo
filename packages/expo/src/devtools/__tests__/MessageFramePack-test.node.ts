import { MessageFramePacker } from '../MessageFramePacker';

describe(MessageFramePacker, () => {
  let packer: MessageFramePacker<string>;

  beforeEach(() => {
    packer = new MessageFramePacker();
  });

  it('should pack and unpack a message with a string payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: 'testPayload',
    };

    const packedData = packer.pack(messageFrame);
    if (packedData instanceof Promise || packedData instanceof Uint8Array) {
      throw new Error('Unexpected packed data type');
    }
    const unpackedData = packer.unpack(packedData);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with a number payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: 12345,
    };

    const packedData = packer.pack(messageFrame);
    if (packedData instanceof Promise || packedData instanceof Uint8Array) {
      throw new Error('Unexpected packed data type');
    }
    const unpackedData = packer.unpack(packedData);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with a null payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: null,
    };

    const packedData = packer.pack(messageFrame);
    if (packedData instanceof Promise || packedData instanceof Uint8Array) {
      throw new Error('Unexpected packed data type');
    }
    const unpackedData = packer.unpack(packedData);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with an undefined payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
    };

    const packedData = packer.pack(messageFrame);
    if (packedData instanceof Promise || packedData instanceof Uint8Array) {
      throw new Error('Unexpected packed data type');
    }
    const unpackedData = packer.unpack(packedData);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with an object payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: { key: 'value' },
    };

    const packedData = packer.pack(messageFrame);
    if (packedData instanceof Promise || packedData instanceof Uint8Array) {
      throw new Error('Unexpected packed data type');
    }
    const unpackedData = packer.unpack(packedData);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with an Uint8Array payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: new Uint8Array([1, 2, 3, 4]),
    };

    const packedData = packer.pack(messageFrame);
    if (packedData instanceof Promise || typeof packedData === 'string') {
      throw new Error('Unexpected packed data type');
    }
    const unpackedData = packer.unpack(packedData.buffer);
    expect(unpackedData.messageKey).toEqual(messageFrame.messageKey);
    expect(unpackedData.payload).toEqual(messageFrame.payload);
  });

  it('should pack and unpack a message with an ArrayBuffer payload', async () => {
    const buffer = new ArrayBuffer(4);
    const view = new Uint8Array(buffer);
    view.set([1, 2, 3, 4]);

    const messageFrame = {
      messageKey: 'testKey',
      payload: buffer,
    };

    const packedData = packer.pack(messageFrame);
    if (packedData instanceof Promise || typeof packedData === 'string') {
      throw new Error('Unexpected packed data type');
    }
    const unpackedData = packer.unpack(packedData.buffer);
    expect(unpackedData.messageKey).toEqual(messageFrame.messageKey);
    expect(new Uint8Array(unpackedData.payload as ArrayBuffer)).toEqual(view);
  });

  it('should pack and unpack a message with a Blob payload', async () => {
    const blob = new Blob(['testBlob'], { type: 'text/plain' });

    const messageFrame = {
      messageKey: 'testKey',
      payload: blob,
    };

    const packedDataPromise = packer.pack(messageFrame);
    if (packedDataPromise instanceof Uint8Array || typeof packedDataPromise === 'string') {
      throw new Error('Unexpected packed data type');
    }
    const packedData = await packedDataPromise;
    const unpackedData = packer.unpack(packedData.buffer);
    expect(unpackedData.messageKey).toEqual(messageFrame.messageKey);
    const unpackedBlob = unpackedData.payload as Blob;
    expect(await unpackedBlob.text()).toEqual(await blob.text());
  });

  it('should pack and unpack a message with an object messageKey', async () => {
    const packerWithObjectKey = new MessageFramePacker<{ key: string }>();
    const messageFrame = {
      messageKey: { key: 'value' },
      payload: 'testPayload',
    };

    const packedData = packerWithObjectKey.pack(messageFrame);
    if (packedData instanceof Promise || packedData instanceof Uint8Array) {
      throw new Error('Unexpected packed data type');
    }
    const unpackedData = packerWithObjectKey.unpack(packedData);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should throw an error for an unsupported payload type', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: () => {},
    };

    expect(() => {
      packer.pack(messageFrame);
    }).toThrow('Unsupported payload type');
  });
});
