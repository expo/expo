import * as fs from 'fs';
import * as path from 'path';
import { isURL } from 'xdl/build/UrlUtils';

import { CommandError } from '../utils/errors';

export function resolveTemplateOption(template: string) {
  if (isURL(template, {})) {
    return template;
  }
  const templatePath = path.resolve(template);
  if (!fs.existsSync(templatePath)) {
    throw new CommandError('template file does not exist: ' + templatePath);
  }
  if (!fs.statSync(templatePath).isFile()) {
    throw new CommandError(
      'template must be a tar file created by running `npm pack` in a project: ' + templatePath
    );
  }
  return templatePath;
}
