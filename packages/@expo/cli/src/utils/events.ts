import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'utils:editor_found': { source: string; name: string };
    'utils:editor_opened': { file: string; editor: string };
    'utils:editor_open_failed': { file: string; binary: string; error: SerializedError };
    'utils:exit_hook_error': { index: string; error: SerializedError };
    'utils:exit_safe': Record<string, never>;
    'utils:exit_blocked': { resources: string[] };
    'utils:exit_forced': { resources: string[] };
    'utils:exit_handles': { summary: Record<string, number> };
    'utils:exit_handle_info_failed': { error: SerializedError };
    'utils:file_observing': { path: string };
    'utils:invalid_package_name': { name: string; owner: string; slug: string };
    'utils:port_pid': { port: number; pid: number };
    'utils:port_pid_failed': { port: number; error: SerializedError };
    'utils:npm_run': { command: string };
    'utils:npm_fetch_url': { url: string };
    'utils:prompt_filter_error': { error: SerializedError };
    'utils:scheme_ios_plist_path': { path: string };
    'utils:scheme_ios_schemes': { schemes: string[] };
    'utils:scheme_android_schemes': { schemes: string[] };
    'utils:scheme_ios_error': { error: SerializedError };
    'utils:scheme_android_error': { error: SerializedError };
    'utils:bundle_id_no_network': { bundleId: string };
    'utils:bundle_id_checking': { bundleId: string; url: string };
    'utils:bundle_id_check_error': { bundleId: string; error: SerializedError };
    'utils:package_name_no_network': { packageName: string };
    'utils:package_name_checking': { packageName: string; url: string };
    'utils:package_name_check_error': { packageName: string; error: SerializedError };
    'utils:variadic_extras': { extras: string[] };
    'utils:variadic_parsed': {
      variadic: string[];
      flags: Record<string, unknown>;
      extras: string[];
    };
  }
}

export const event = events.debug('utils');
