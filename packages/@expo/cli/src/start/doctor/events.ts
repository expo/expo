import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'doctor:check': {
      name: string;
      platform?: string;
      satisfied: boolean;
      message?: string;
    };
    'doctor:dependencies:missing': {
      packages: string[];
    };
    'doctor:simulator_xcode_select_path': { path: string | null };
    'doctor:simulator_app_id': { appId: string };
    'doctor:xcode_version': { version: string | null | false };
    'doctor:xcode_select_path': { path: string | null };
    'doctor:xcode_setup_unexpected': { version: string | null | false; path: string | null };
    'doctor:dependency_version_mismatch': { pkg: string; installed: string; expected: string };
    'doctor:validate_checking_deps': { sdkVersion: string; deps: Record<string, string> };
    'doctor:validate_known_versions': { packages: string[] };
    'doctor:validate_exclude_invalid_range': { name: string; range: string };
    'doctor:validate_exclude_unsupported_type': { name: string; type: string };
    'doctor:validate_excluded_deps': { packages: string[] };
    'doctor:tv_dist_tag_fallback': { bundledVersion: string; reason: string };
    'doctor:tv_dist_tag_not_published': { tag: string };
    'doctor:tv_dist_tags_fetch_error': { error: SerializedError };
    'doctor:tv_dist_tags_body_error': { error: SerializedError };
    'doctor:tv_dist_tags_http_error': { status: number };
    'doctor:external_module_resolve_failed': { message: string };
  }
}

export const event = events('doctor');
export const debugEvent = events.debug('doctor');
