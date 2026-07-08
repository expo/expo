import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'transform:worker:started': { pid: number };
    'transform:failed': { file: string; error: SerializedError };
    'transform:custom_transformer:loaded': { path: string };
    'transform:custom_transformer:failed': { path: string; error: SerializedError };

    'transform:file': {
      file: string;
      platform: string | null;
      environment: string | null;
      type: string;
      deps: number;
      cached: false;
    };

    // debug keys
    'transform:browserslist:targets': { targets: Record<string, unknown> };
    'transform:collect_deps:magic_comment_ignored': { line: number | string; code: string };
    'transform:client_boundaries:parsed': { boundaries: string[] };
    'transform:postcss:config_loaded': { path: string };
    'transform:postcss:plugin_loaded': { plugin: string };
    'transform:module_mapper:request_redirected': { request: string; resolved: string };
    'transform:module_mapper:redirect_failed': { request: string; error: SerializedError };
    'transform:import_export:unexpected_object_pattern': { node: string };
    'transform:import_export:unexpected_array_pattern': { node: string };
    'transform:import_export:unexpected_identifier': { node: string };
    'transform:import_export:unexpected_declaration': { node: string };
    'transform:import_export:unexpected_specifier': { node: string };
    'transform:babel:missing_router_root': { message: string };
  }
}

export const event = events('transform');
export const debugEvent = events.debug('transform');
