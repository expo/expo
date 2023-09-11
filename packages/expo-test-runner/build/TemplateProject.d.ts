import { Definitions } from 'dot';
import { Application, DetoxTest } from './Config';
import { Platform } from './Platform';
import { ProjectFile } from './TemplateFile';
export default class TemplateProject {
    protected config: Application;
    protected name: string;
    protected platform: Platform;
    protected configFilePath: string;
    constructor(config: Application, name: string, platform: Platform, configFilePath: string);
    getDefinitions(): Definitions;
    createApplicationAsync(projectPath: string): Promise<void>;
    getTemplateFiles(): {
        [path: string]: ProjectFile;
    };
    protected userFilePath(relativePath: string): string;
    protected copyFilesAsync(projectPath: string, files: {
        [path: string]: ProjectFile;
    }): Promise<void>;
    protected evaluateFiles(projectPath: string, files: {
        [path: string]: ProjectFile;
    }): Promise<void>;
    build(projectPath: string, test: DetoxTest): Promise<void>;
    run(projectPath: string, test: DetoxTest): Promise<void>;
}
