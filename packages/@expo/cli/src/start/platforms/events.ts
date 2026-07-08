import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    // android/activateWindow.ts
    'platform:activate_window_lsof': { args: string };
    'platform:activate_window_pid': { pid: string };
    // android/adb.ts
    'platform:adb_property_data': { devicePid: string | undefined; prop: string; data: string };
    'platform:adb_parsed_properties': { props: Record<string, string> };
    // android/adbReverse.ts
    'platform:adb_reverse_sdk_missing': { error: SerializedError };
    'platform:adb_reverse_port_failed': { port: number; deviceName: string };
    'platform:adb_reverse_unforward_failed': { port: number; error: SerializedError };
    // android/ADBServer.ts
    'platform:adb_server_run': { command: string };
    'platform:adb_file_output': { output: string };
    // android/gradle.ts
    'platform:gradle_spawn': { command: string };
    // ExpoGoInstaller.ts
    'platform:expo_go_version_check': {
      expectedVersion: string | null;
      installedVersion: string | null;
    };
    // ios/AppleAppIdResolver.ts
    'platform:apple_app_id_native_check_error': { error: SerializedError };
    'platform:apple_app_id_pbxproj_error': { error: SerializedError };
    'platform:apple_app_id_plist_error': { error: SerializedError };
    // ios/AppleDeviceManager.ts
    'platform:apple_bundle_id_resolved': { filePath: string; bundleId: string };
    'platform:apple_bundle_id_fallback': Record<string, never>;
    // ios/devicectl.ts
    'platform:devicectl_not_found': Record<string, never>;
    'platform:devicectl_install_spawn': { command: string };
    'platform:devicectl_install_device': { props: Record<string, unknown> };
    // ios/getBestSimulator.ts
    'platform:simulator_first_booted': { windowName: string };
    'platform:simulator_no_match': { osType: string | undefined };
    'platform:simulator_default_id': { defaultId: string | null };
    // ios/simctl.ts
    'platform:simctl_skip_deep_link_perms': {
      url: string;
      appId: string | undefined;
      udid: string | undefined;
    };
    'platform:simctl_deep_link_perms': {
      url: string;
      appId: string | undefined;
      udid: string | undefined;
    };
    'platform:simctl_url_scheme_parse_error': { error: SerializedError };
    'platform:simctl_allowed_links': { plistData: Record<string, unknown> };
    'platform:simctl_allow_deep_link': { key: string; appId: string | undefined };
    // ios/xcrun.ts
    'platform:xcrun_run': { command: string };
    // PlatformManager.ts
    'platform:open_launch_url': { appId: string; redirectUrl: string };
    'platform:open_custom': { props: string };
    'platform:open_custom_url': { url: string | null; props: string };
    'platform:open_async': { runtime: string; platform: string; shouldPrompt: boolean | undefined };
  }
}

export const event = events.debug('platform');
