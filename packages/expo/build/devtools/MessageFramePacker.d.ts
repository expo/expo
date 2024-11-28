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
type MessageKeyTypeBase = string | object;
type PayloadType = Uint8Array | string | number | null | undefined | object | ArrayBuffer | Blob;
interface MessageFrame<T extends MessageKeyTypeBase> {
    messageKey: T;
    payload?: PayloadType;
}
export declare class MessageFramePacker<T extends MessageKeyTypeBase> {
    private textEncoder;
    private textDecoder;
    pack({ messageKey, payload }: MessageFrame<T>): Promise<Uint8Array>;
    unpack(packedData: ArrayBuffer): Promise<MessageFrame<T>>;
    private payloadToUint8Array;
    private deserializePayload;
    private static getPayloadTypeIndicator;
}
export {};
//# sourceMappingURL=MessageFramePacker.d.ts.map