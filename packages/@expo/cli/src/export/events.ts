import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'export:done': {
      platforms: string[];
      outputDir: string;
      mode: 'static' | 'server' | 'single';
      dev: boolean;
    };
    'export:bundle': {
      platform: string;
      assets: number;
      ms: number;
    };
    'export:static:routes': {
      total: number;
      withLoaders: number;
    };
    'export:eager:starting': { bundleOutput: string };
    'export:embed:nonstandard_location': { bundleOutput: string };
    'export:embed:possible_previous_bundle': { possiblePath: string };
    'export:embed:removing_previous_bundle': { previousPath: string };
    'export:server:dump_logs': { outputPath: string };
    'export:server:found_eas_cli': { globalBin: string };
    'export:server:deploy_stdout': { stdout: string };
    'export:assets:asset_filter': { file: string; include: boolean };
    'export:assets:all': { assets: string };
    'export:assets:bundled': { bundledAssets: string };
    'export:assets:filtered_count': { count: number };
    'export:dom:bundle': { filePath: string };
    'export:static:routes_manifest': { routes: string };
    'export:static:bundling_loaders': { modules: string[] };
    'export:favicon:storing_asset': { assetPath: string };
    'export:favicon:writing_asset': { assetPath: string };
    'export:public_folder:found_file': { possiblePath: string };
  }
}

export const event = events('export');
export const debugEvent = events.debug('export');
