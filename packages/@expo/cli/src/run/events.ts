import { events } from '2g';
import type { SerializedError } from '2g';

type RunPlatform = 'ios' | 'android';

declare module '2g' {
  interface EventRegistry {
    'run:device:selected': {
      platform: RunPlatform;
      name: string;
      id: string;
      os: string | null;
      type: 'simulator' | 'emulator' | 'device';
    };
    'run:build:done': {
      platform: RunPlatform;
      scheme?: string;
      configuration?: string;
      deviceId: string | null;
    };
    'run:build:failed': {
      platform: RunPlatform;
      error: SerializedError;
    };
    'run:install': {
      platform: RunPlatform;
      appId: string;
    };
    'run:launch': {
      platform: RunPlatform;
      appId: string;
    };
    'run:android:resolved_device': { name: string; pid: string };
    'run:android:apk_metadata_parse_failed': { error: SerializedError };
    'run:android:apk_resolved_abi_split': { outputFile: string };
    'run:android:apk_resolved': { outputFile: string };
    'run:android:apk_search': { directory: string };
    'run:android:apk_check': { path: string };
    'run:android:package_name': { name: string };
    'run:ios:binary_path': { path: string };
    'run:ios:terminate_failed': { error: SerializedError };
    'run:ios:binary_copy': { path: string };
    'run:ios:ipa_extract': { ipaPath: string; outputPath: string };
    'run:ios:simulator_provisioned': Record<string, never>;
    'run:ios:default_scheme': { name: string };
    'run:ios:entitlements_read_failed': { error: SerializedError };
    'run:apple_device:unknown_platform': { platform: string };
    'run:apple_device:unknown_usbmuxd_platform': { platform: string };
    'run:apple_device:run_started': { udid: string; bundleId: string };
    'run:apple_device:launch_fallback': { error: SerializedError };
    'run:apple_device:disconnect_response': { result: string };
    'run:apple_device:wait_app': Record<string, never>;
    'run:apple_device:launch_retry': { tries: number };
    'run:apple_device:afc_no_resources_retry': { path: string; tries: number };
    'run:apple_device:afc_pending_queue': { length: number };
    'run:build_cache:no_fingerprint': Record<string, never>;
    'run:codesigning:eas_not_configured': Record<string, never>;
  }
}

export const event = events('run');
export const debugEvent = events.debug('run');
