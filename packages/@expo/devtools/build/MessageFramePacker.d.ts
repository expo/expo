/**
 * A message frame packer that serializes a messageKey and a payload into either a JSON string
 * (fast path) or a binary format (for complex payloads).
 *
 * Fast Path (JSON.stringify/JSON.parse):
 * - For simple payloads (e.g., strings, numbers, null, undefined, or plain objects), the packer
 *   uses `JSON.stringify` for serialization and `JSON.parse` for deserialization, ensuring
 *   optimal performance.
 *
 * Binary Format:
 * - For more complex payloads (e.g., Uint8Array, ArrayBuffer, Blob), the packer uses a binary
 *   format with the following structure:
 *
 *   +------------------+-------------------+----------------------------+--------------------------+
 *   | 4 bytes (Uint32) | Variable length   | 1 byte (Uint8)             | Variable length          |
 *   | MessageKeyLength | MessageKey (JSON) | PayloadTypeIndicator (enum)| Payload (binary data)    |
 *   +------------------+-------------------+----------------------------+--------------------------+
 *
 *   1. MessageKeyLength (4 bytes):
 *      - A 4-byte unsigned integer indicating the length of the MessageKey JSON string.
 *
 *   2. MessageKey (Variable length):
 *      - The JSON string representing the message key, encoded as UTF-8.
 *
 *   3. PayloadTypeIndicator (1 byte):
 *      - A single byte enum value representing the type of the payload (e.g., Uint8Array, String,
 *        Object, ArrayBuffer, Blob).
 *
 *   4. Payload (Variable length):
 *      - The actual payload data, which can vary in type and length depending on the PayloadType.
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
    pack({ messageKey, payload }: MessageFrame<T>): string | Uint8Array | Promise<Uint8Array>;
    unpack(packedData: string | ArrayBuffer): MessageFrame<T>;
    private isFastPathPayload;
    private payloadToUint8Array;
    private packImpl;
    private deserializePayload;
    private static getPayloadTypeIndicator;
}
export {};
//# sourceMappingURL=MessageFramePacker.d.ts.map