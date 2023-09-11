import * as fs from 'fs-extra';
import { join } from 'path';

import { SelfPath } from './Paths';
import { Platform } from './Platform';
import TemplateEvaluator from './TemplateEvaluator';

export interface ProjectFile {
  platform: Platform;
  copy(projectPath: string, outputPath: string): Promise<void>;
  evaluate(projectPath: string, filePath: string, evaluator: TemplateEvaluator): Promise<void>;
}

export class TemplateFile implements ProjectFile {
  constructor(
    public template: string,
    public platform: Platform = Platform.Both,
    public shouldBeEvaluated: boolean = false
  ) {}

  async copy(projectPath: string, outputPath: string): Promise<void> {
    return fs.copy(
      join(SelfPath, 'templates', this.template, outputPath),
      join(projectPath, outputPath),
      {
        recursive: true,
      }
    );
  }

  async evaluate(
    projectPath: string,
    filePath: string,
    evaluator: TemplateEvaluator
  ): Promise<void> {
    if (this.shouldBeEvaluated) {
      return evaluator.compileFileAsync(join(projectPath, filePath));
    }

    return Promise.resolve();
  }
}

export class UserFile implements ProjectFile {
  constructor(
    public userFilePath: string,
    public platform: Platform = Platform.Both,
    public shouldBeEvaluated: boolean = false
  ) {}

  copy(projectPath: string, outputPath: string): Promise<void> {
    return fs.copy(this.userFilePath, join(projectPath, outputPath), {
      recursive: true,
    });
  }

  evaluate(projectPath: string, filePath: string, evaluator: any): Promise<void> {
    if (this.shouldBeEvaluated) {
      return evaluator.compileFileAsync(join(projectPath, filePath));
    }

    return Promise.resolve();
  }
}

export class TemplateFilesFactory {
  constructor(private template: string) {}

  file(shouldBeEvaluated: boolean = false): TemplateFile {
    return new TemplateFile(this.template, Platform.Both, shouldBeEvaluated);
  }

  androidFile(shouldBeEvaluated: boolean = false): TemplateFile {
    return new TemplateFile(this.template, Platform.Android, shouldBeEvaluated);
  }

  iosFile(shouldBeEvaluated: boolean = false): TemplateFile {
    return new TemplateFile(this.template, Platform.iOS, shouldBeEvaluated);
  }
}
