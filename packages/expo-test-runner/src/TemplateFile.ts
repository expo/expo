import fs from 'fs';
import { dirname, join } from 'path';

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
    const src = join(SelfPath, 'templates', this.template, outputPath);
    const dest = join(projectPath, outputPath);
    const stat = await fs.promises.stat(src);
    if (!stat.isFile()) {
      // NOTE(@kitten): Explicit error was added when switching from fs-extra.copy, which defaults to recursive copying
      // However, this should only be used on single files, so an explicit error was added
      throw new TypeError(`Expected outputPath (${outputPath}) to be path to a single file`);
    }
    await fs.promises.mkdir(dirname(dest), { recursive: true });
    return fs.promises.copyFile(src, dest);
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
    return fs.promises.cp(this.userFilePath, join(projectPath, outputPath), {
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
