import { join } from 'path';

import { Config } from './Config';

export default class ConfigReader {
  constructor(private path: string) {}

  readConfigFile(): Config {
    return require(this.path) as Config;
  }

  static getFilePath(path: string | undefined): string {
    return path ? path : join(process.cwd(), 'test-runner.config.js');
  }
}
