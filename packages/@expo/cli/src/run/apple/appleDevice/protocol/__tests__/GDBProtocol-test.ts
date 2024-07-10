import { GDBProtocolReader } from '../GDBProtocol';

const DEVICE_LOCKED_BUFFER = Buffer.from(
  `$EThe operation couldn’t be completed. Unable to launch org.name.yolo834 because the device was not, or could not be, unlocked.#89`
);

describe(GDBProtocolReader, () => {
  describe(`parseBody`, () => {
    it(`parses event`, () => {
      const reader = new GDBProtocolReader(() => {});
      expect(reader.parseBody(Buffer.from('$OK#9a'))).toBe('OK');
    });
    it(`parses device locked event`, () => {
      const reader = new GDBProtocolReader(() => {});
      expect(() => reader.parseBody(DEVICE_LOCKED_BUFFER)).toThrowErrorMatchingInlineSnapshot(
        `"Device is currently locked."`
      );
    });
  });
});
