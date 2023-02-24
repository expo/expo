import { Definitions, template } from 'dot';
import * as fs from 'fs-extra';

export default class TemplateEvaluator {
  constructor(private definitions: Definitions) {}

  async compileFileAsync(path: string) {
    const fileContent = await fs.readFile(path, 'utf-8');
    const templateFn = template(fileContent, {
      strip: false,
    });

    await fs.writeFile(path, templateFn(this.definitions));
  }
}
