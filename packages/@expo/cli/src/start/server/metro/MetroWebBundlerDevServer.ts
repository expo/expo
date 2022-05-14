import { MetroBundlerDevServer } from './MetroBundlerDevServer';

export class MetroWebBundlerDevServer extends MetroBundlerDevServer {
  isTargetingWeb(): boolean {
    return true;
  }

  protected getConfigModuleIds(): string[] {
    return [
      './metro.config.web.js',
      './metro.config.js',
      './metro.config.json',
      './rn-cli.config.js',
    ];
  }
}
