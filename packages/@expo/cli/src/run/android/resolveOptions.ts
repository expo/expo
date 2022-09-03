import { AndroidDeviceManager } from '../../start/platforms/android/AndroidDeviceManager';
import { BundlerProps, resolveBundlerPropsAsync } from '../resolveBundlerProps';
import { resolveDeviceAsync } from './resolveDevice';
import { GradleProps, resolveGradleProps } from './resolveGradleProps';
import { LaunchProps, resolveLaunchPropsAsync } from './resolveLaunchProps';

export type Options = {
  variant?: string;
  device?: boolean | string;
  port?: number;
  bundler?: boolean;
  install?: boolean;
  buildCache?: boolean;
  template?: string;
};

export type ResolvedOptions = GradleProps &
  BundlerProps &
  LaunchProps & {
    variant: string;
    buildCache: boolean;
    device: AndroidDeviceManager;
    install: boolean;
  };

export async function resolveOptionsAsync(
  projectRoot: string,
  options: Options
): Promise<ResolvedOptions> {
  return {
    ...(await resolveBundlerPropsAsync(projectRoot, options)),
    ...resolveGradleProps(projectRoot, options),
    ...(await resolveLaunchPropsAsync(projectRoot)),
    variant: options.variant ?? 'debug',
    // Resolve the device based on the provided device id or prompt
    // from a list of devices (connected or simulated) that are filtered by the scheme.
    device: await resolveDeviceAsync(options.device),
    buildCache: !!options.buildCache,
    install: !!options.install,
  };
}
