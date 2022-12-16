import escapeRegExp from 'lodash/escapeRegExp';

import { StringTransform, transformString } from '../../Transforms';

type DebugableStringTransform = StringTransform & {
  debug?: boolean;
};

export function baseCmakeTransforms(
  abiVersion: string,
  libNames: string[]
): DebugableStringTransform[] {
  const renameFirstArg = (text: string) =>
    transformString(
      text,
      libNames.map((lib) => ({
        find: new RegExp(`^(\\\s*)${escapeRegExp(lib)}($|\\\s)`),
        replaceWith: `$1${lib}_${abiVersion}$2`,
      }))
    );
  const renameLibs = (text: string) =>
    transformString(
      text,
      libNames.map((lib) => ({
        find: new RegExp(`(^|\\\s)${escapeRegExp(lib)}($|\\\s)`, 'g'),
        replaceWith: `$1${lib}_${abiVersion}$2`,
      }))
    );
  return [
    {
      find: /(target_link_libraries\()([\s\S]*?)(\))/g,
      replaceWith: (_, p1, p2, p3) => [p1, renameLibs(p2), p3].join(''),
    },
    {
      find: /(add_library\()([\s\S]*?)(\))/g,
      replaceWith: (_, p1, p2, p3) => [p1, renameFirstArg(p2), p3].join(''),
    },
    {
      find: /(target_include_directories\()([\s\S]*?)(\))/g,
      replaceWith: (_, p1, p2, p3) => [p1, renameFirstArg(p2), p3].join(''),
    },
    {
      find: /(target_compile_options\()([\s\S]*?)(\))/g,
      replaceWith: (_, p1, p2, p3) => [p1, renameFirstArg(p2), p3].join(''),
    },
    {
      find: /(set_target_properties\()([\s\S]*?)(\))/g,
      replaceWith: (_, p1, p2, p3) => [p1, renameFirstArg(p2), p3].join(''),
    },
  ];
}
