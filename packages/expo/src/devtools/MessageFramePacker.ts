/**
 * A message frame packer that serializes a messageKey and a payload into a binary format.
 *
 * +------------------+-------------------+----------------------------+--------------------------+
 * | 4 bytes (Uint32) | Variable length   | 1 byte (Uint8)             | Variable length          |
 * | MessageKeyLength | MessageKey (JSON) | PayloadTypeIndicator (enum)| Payload (binary data)    |
 * +------------------+-------------------+----------------------------+--------------------------+
 *
 * MessageFrame Format:
 *
 * 1. MessageKeyLength (4 bytes):
 *    - A 4-byte unsigned integer indicating the length of the MessageKey JSON string.
 *
 * 2. MessageKey (Variable length):
 *    - The JSON string representing the message key, encoded as UTF-8.
 *
 * 3. PayloadTypeIndicator (1 byte):
 *    - A single byte enum value representing the type of the payload (e.g., Uint8Array, String, Object, ArrayBuffer, Blob).
 *
 * 4. Payload (Variable length):
 *    - The actual payload data, which can vary in type and length depending on the PayloadType.
 *
 */

import { blobToArrayBufferAsync } from './blobUtils';

type MessageKeyTypeBase = string | object;
type PayloadType = Uint8Array | string | number | null | undefined | object | ArrayBuffer | Blob;

enum PayloadTypeIndicator {
  Uint8Array = 1,
  String = 2,
  Number = 3,
  Null = 4,
  Undefined = 5,
  Object = 6,
  ArrayBuffer = 7,
  Blob = 8,
}

interface MessageFrame<T extends MessageKeyTypeBase> {
  messageKey: T;
  payload?: PayloadType;
}

export class MessageFramePacker<T extends MessageKeyTypeBase> {
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();

  public async pack({ messageKey, payload }: MessageFrame<T>): Promise<Uint8Array> {
    const messageKeyString = JSON.stringify(messageKey);
    const messageKeyBytes = this.textEncoder.encode(messageKeyString);
    const messageKeyLength = messageKeyBytes.length;
    const payloadBinary = await this.payloadToUint8Array(payload);

    const totalLength = 4 + messageKeyLength + 1 + payloadBinary.byteLength;
    const buffer = new ArrayBuffer(totalLength);
    const packedArray = new Uint8Array(buffer);

    // [0] messageKeyLength (4 bytes)
    const messageKeyLengthView = new DataView(buffer, 0, 4);
    messageKeyLengthView.setUint32(0, messageKeyLength, false);

    // [1] messageKey (variable length)
    packedArray.set(messageKeyBytes, 4);

    // [2] payloadTypeIndicator (1 byte)
    const payloadTypeView = new DataView(buffer, 4 + messageKeyLength, 1);
    payloadTypeView.setUint8(0, MessageFramePacker.getPayloadTypeIndicator(payload));

    // [3] payload (variable length)
    packedArray.set(payloadBinary, 4 + messageKeyLength + 1);

    return packedArray;
  }

  public async unpack(packedData: ArrayBuffer): Promise<MessageFrame<T>> {
    // [0] messageKeyLength (4 bytes)
    const messageKeyLengthView = new DataView(packedData, 0, 4);
    const messageKeyLength = messageKeyLengthView.getUint32(0, false);

    // [1] messageKey (variable length)
    const messageKeyBytes = packedData.slice(4, 4 + messageKeyLength);
    const messageKeyString = this.textDecoder.decode(messageKeyBytes);
    const messageKey = JSON.parse(messageKeyString);

    // [2] payloadTypeIndicator (1 byte)
    const payloadTypeView = new DataView(packedData, 4 + messageKeyLength, 1);
    const payloadType = payloadTypeView.getUint8(0);

    // [3] payload (variable length)
    const payloadBinary = packedData.slice(4 + messageKeyLength + 1);
    const payload = await this.deserializePayload(payloadBinary, payloadType);

    return { messageKey, payload };
  }

  private async payloadToUint8Array(payload: PayloadType): Promise<Uint8Array> {
    if (payload instanceof Uint8Array) {
      return payload;
    } else if (typeof payload === 'string') {
      return this.textEncoder.encode(payload);
    } else if (typeof payload === 'number') {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setFloat64(0, payload, false);
      return new Uint8Array(buffer);
    } else if (payload === null) {
      return new Uint8Array(0);
    } else if (payload === undefined) {
      return new Uint8Array(0);
    } else if (payload instanceof ArrayBuffer) {
      return new Uint8Array(payload);
    } else if (payload instanceof Blob) {
      return new Uint8Array(await blobToArrayBufferAsync(payload));
    } else {
      return this.textEncoder.encode(JSON.stringify(payload));
    }
  }

  private async deserializePayload(
    payloadBinary: ArrayBuffer,
    payloadTypeIndicator: PayloadTypeIndicator
  ): Promise<PayloadType> {
    switch (payloadTypeIndicator) {
      case PayloadTypeIndicator.Uint8Array: {
        return new Uint8Array(payloadBinary);
      }
      case PayloadTypeIndicator.String: {
        return this.textDecoder.decode(payloadBinary);
      }
      case PayloadTypeIndicator.Number: {
        const view = new DataView(payloadBinary);
        return view.getFloat64(0, false);
      }
      case PayloadTypeIndicator.Null: {
        return null;
      }
      case PayloadTypeIndicator.Undefined: {
        return undefined;
      }
      case PayloadTypeIndicator.Object: {
        const jsonString = this.textDecoder.decode(payloadBinary);
        return JSON.parse(jsonString);
      }
      case PayloadTypeIndicator.ArrayBuffer: {
        return payloadBinary;
      }
      case PayloadTypeIndicator.Blob: {
        return new Blob([payloadBinary]);
      }
      default:
        throw new Error('Unsupported payload type');
    }
  }

  private static getPayloadTypeIndicator(payload: PayloadType): PayloadTypeIndicator {
    if (payload instanceof Uint8Array) {
      return PayloadTypeIndicator.Uint8Array;
    } else if (typeof payload === 'string') {
      return PayloadTypeIndicator.String;
    } else if (typeof payload === 'number') {
      return PayloadTypeIndicator.Number;
    } else if (payload === null) {
      return PayloadTypeIndicator.Null;
    } else if (payload === undefined) {
      return PayloadTypeIndicator.Undefined;
    } else if (payload instanceof ArrayBuffer) {
      return PayloadTypeIndicator.ArrayBuffer;
    } else if (payload instanceof Blob) {
      return PayloadTypeIndicator.Blob;
    } else if (typeof payload === 'object') {
      return PayloadTypeIndicator.Object;
    } else {
      throw new Error('Unsupported payload type');
    }
  }
}
