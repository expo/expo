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

    const packedData = await packer.pack(messageFrame);
    const unpackedData = await packer.unpack(packedData.buffer);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with a number payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: 12345,
    };

    const packedData = await packer.pack(messageFrame);
    const unpackedData = await packer.unpack(packedData.buffer);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with a null payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: null,
    };

    const packedData = await packer.pack(messageFrame);
    const unpackedData = await packer.unpack(packedData.buffer);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with an undefined payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
    };

    const packedData = await packer.pack(messageFrame);
    const unpackedData = await packer.unpack(packedData.buffer);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with an object payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: { key: 'value' },
    };

    const packedData = await packer.pack(messageFrame);
    const unpackedData = await packer.unpack(packedData.buffer);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should pack and unpack a message with an Uint8Array payload', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: new Uint8Array([1, 2, 3, 4]),
    };

    const packedData = await packer.pack(messageFrame);
    const unpackedData = await packer.unpack(packedData.buffer);
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

    const packedData = await packer.pack(messageFrame);
    const unpackedData = await packer.unpack(packedData.buffer);
    expect(unpackedData.messageKey).toEqual(messageFrame.messageKey);
    expect(new Uint8Array(unpackedData.payload as ArrayBuffer)).toEqual(view);
  });

  it('should pack and unpack a message with a Blob payload', async () => {
    const blob = new Blob(['testBlob'], { type: 'text/plain' });

    const messageFrame = {
      messageKey: 'testKey',
      payload: blob,
    };

    const packedData = await packer.pack(messageFrame);
    const unpackedData = await packer.unpack(packedData.buffer);
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

    const packedData = await packerWithObjectKey.pack(messageFrame);
    const unpackedData = await packerWithObjectKey.unpack(packedData.buffer);
    expect(unpackedData).toEqual(messageFrame);
  });

  it('should throw an error for an unsupported payload type', async () => {
    const messageFrame = {
      messageKey: 'testKey',
      payload: () => {},
    };

    await expect(packer.pack(messageFrame)).rejects.toThrow('Unsupported payload type');
  });
});
