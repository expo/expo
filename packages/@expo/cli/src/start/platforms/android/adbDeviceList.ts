export interface AdbDeviceRecord {
  serial: string;
  state: string;
  metadata: string[];
  transportId: string | undefined;
}

const DEVICE_LIST_HEADER = 'List of devices attached';

/** Parse the machine-readable records produced by `adb devices -l`. */
export function parseAdbDeviceList(output: string): AdbDeviceRecord[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== DEVICE_LIST_HEADER && !line.match(/\.cpp:[0-9]+/))
    .map(parseDeviceLine)
    .filter((record): record is AdbDeviceRecord => record != null);
}

function parseDeviceLine(line: string): AdbDeviceRecord | null {
  const match = line.match(/^(\S+)\s+(.+)$/);
  if (!match) {
    return null;
  }

  const [, serial, remainder] = match;
  const fields = remainder!.split(/\s+/);
  const state = fields[0] === 'no' && fields[1] === 'permissions' ? 'no permissions' : fields[0]!;
  const metadata = fields.slice(state === 'no permissions' ? 2 : 1);
  const transportId = metadata
    .find((field) => field.startsWith('transport_id:'))
    ?.slice('transport_id:'.length);

  return {
    serial: serial!,
    state,
    metadata,
    transportId,
  };
}
