import fs from 'node:fs';

import {
  createFileFromTemplate as createFileFromTemplateCommon,
  createFileFromTemplateAs as createFileFromTemplateAsCommon,
  readFromTemplate as readFromTemplateCommon,
} from '../../common/filesystem';

export const mkdir = (path: string, recursive: boolean = false) => {
  fs.mkdirSync(path, {
    recursive,
  });
};

export const createFileFromTemplate = (
  template: string,
  at: string,
  variables?: Record<string, unknown>,
) => {
  createFileFromTemplateCommon(template, at, 'ios', variables);
};

export const createFileFromTemplateAs = (
  template: string,
  at: string,
  as: string,
  variables?: Record<string, unknown>,
) => {
  createFileFromTemplateAsCommon(template, at, as, 'ios', variables);
};

export const readFromTemplate = (
  template: string,
  variables?: Record<string, unknown>,
) => {
  return readFromTemplateCommon(template, 'ios', variables);
};
