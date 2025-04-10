import { Definitions, template } from 'dot';
import fs from 'fs';

export default class TemplateEvaluator {
  constructor(private definitions: Definitions) {}

  async compileFileAsync(path: string) {
    const fileContent = await fs.promises.readFile(path, 'utf-8');
    const templateFn = template(fileContent, {
      strip: false,
    });

    await fs.promises.writeFile(path, templateFn(this.definitions));
  }
}
