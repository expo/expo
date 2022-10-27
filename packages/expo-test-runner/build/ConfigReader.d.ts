import { Config } from './Config';
export default class ConfigReader {
    private path;
    constructor(path: string);
    readConfigFile(): Config;
    static getFilePath(path: string | undefined): string;
}
