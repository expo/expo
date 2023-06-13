import { Platform } from './Platform';
import TemplateEvaluator from './TemplateEvaluator';
export interface ProjectFile {
    platform: Platform;
    copy(projectPath: string, outputPath: string): Promise<void>;
    evaluate(projectPath: string, filePath: string, evaluator: TemplateEvaluator): Promise<void>;
}
export declare class TemplateFile implements ProjectFile {
    template: string;
    platform: Platform;
    shouldBeEvaluated: boolean;
    constructor(template: string, platform?: Platform, shouldBeEvaluated?: boolean);
    copy(projectPath: string, outputPath: string): Promise<void>;
    evaluate(projectPath: string, filePath: string, evaluator: TemplateEvaluator): Promise<void>;
}
export declare class UserFile implements ProjectFile {
    userFilePath: string;
    platform: Platform;
    shouldBeEvaluated: boolean;
    constructor(userFilePath: string, platform?: Platform, shouldBeEvaluated?: boolean);
    copy(projectPath: string, outputPath: string): Promise<void>;
    evaluate(projectPath: string, filePath: string, evaluator: any): Promise<void>;
}
export declare class TemplateFilesFactory {
    private template;
    constructor(template: string);
    file(shouldBeEvaluated?: boolean): TemplateFile;
    androidFile(shouldBeEvaluated?: boolean): TemplateFile;
    iosFile(shouldBeEvaluated?: boolean): TemplateFile;
}
