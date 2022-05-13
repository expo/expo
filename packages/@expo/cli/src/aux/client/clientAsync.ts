import { Log } from '../../log';
import { Options } from './resolveOptions';

export async function clientAsync(projectRoot: string, { version, device }: Options) {
  Log.log('Installing Expo Go on "%s" (SDK: %s)', device.name, version);
  await device.ensureExpoGoAsync(version);
  await device.activateWindowAsync();
}
