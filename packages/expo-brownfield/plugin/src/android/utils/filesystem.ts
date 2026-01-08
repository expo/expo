import {
  createFileFromTemplate as createFileFromTemplateCommon,
  createFileFromTemplateAs as createFileFromTemplateAsCommon,
} from '../../common/filesystem';

export const createFileFromTemplate = (
  template: string,
  at: string,
  variables?: Record<string, unknown>,
) => {
  createFileFromTemplateCommon(template, at, 'android', variables);
};

export const createFileFromTemplateAs = (
  template: string,
  at: string,
  as: string,
  variables?: Record<string, unknown>,
) => {
  createFileFromTemplateAsCommon(template, at, as, 'android', variables);
};
