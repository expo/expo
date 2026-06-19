// Mirror of `xcode/lib/pbxFile`. Deep-imported by the `Xcodeproj.ts` wrapper,
// `@expo/cli`, and community plugins (e.g. ios-stickers), so Phase 3 must expose
// this at a compatible import path. The logic is a faithful port of the legacy
// constructor so file descriptors carry identical fields.

import path from 'path';

const DEFAULT_SOURCETREE = '"<group>"';
const DEFAULT_PRODUCT_SOURCETREE = 'BUILT_PRODUCTS_DIR';
const DEFAULT_GROUP = 'Resources';
const DEFAULT_FILETYPE = 'unknown';

const FILETYPE_BY_EXTENSION: Record<string, string> = {
  a: 'archive.ar',
  app: 'wrapper.application',
  appex: 'wrapper.app-extension',
  bundle: 'wrapper.plug-in',
  dylib: 'compiled.mach-o.dylib',
  framework: 'wrapper.framework',
  h: 'sourcecode.c.h',
  m: 'sourcecode.c.objc',
  markdown: 'text',
  mdimporter: 'wrapper.cfbundle',
  octest: 'wrapper.cfbundle',
  pch: 'sourcecode.c.h',
  plist: 'text.plist.xml',
  sh: 'text.script.sh',
  swift: 'sourcecode.swift',
  tbd: 'sourcecode.text-based-dylib-definition',
  xcassets: 'folder.assetcatalog',
  xcconfig: 'text.xcconfig',
  xcdatamodel: 'wrapper.xcdatamodel',
  xcodeproj: 'wrapper.pb-project',
  xctest: 'wrapper.cfbundle',
  xib: 'file.xib',
  strings: 'text.plist.strings',
};

const GROUP_BY_FILETYPE: Record<string, string> = {
  'archive.ar': 'Frameworks',
  'compiled.mach-o.dylib': 'Frameworks',
  'sourcecode.text-based-dylib-definition': 'Frameworks',
  'wrapper.framework': 'Frameworks',
  'embedded.framework': 'Embed Frameworks',
  'sourcecode.c.h': 'Resources',
  'sourcecode.c.objc': 'Sources',
  'sourcecode.swift': 'Sources',
};

const PATH_BY_FILETYPE: Record<string, string> = {
  'compiled.mach-o.dylib': 'usr/lib/',
  'sourcecode.text-based-dylib-definition': 'usr/lib/',
  'wrapper.framework': 'System/Library/Frameworks/',
};

const SOURCETREE_BY_FILETYPE: Record<string, string> = {
  'compiled.mach-o.dylib': 'SDKROOT',
  'sourcecode.text-based-dylib-definition': 'SDKROOT',
  'wrapper.framework': 'SDKROOT',
};

const ENCODING_BY_FILETYPE: Record<string, number> = {
  'sourcecode.c.h': 4,
  'sourcecode.c.objc': 4,
  'sourcecode.swift': 4,
  text: 4,
  'text.plist.xml': 4,
  'text.script.sh': 4,
  'text.xcconfig': 4,
  'text.plist.strings': 4,
};

function unquoted(text: string | null | undefined): string {
  return text == null ? '' : text.replace(/(^")|("$)/g, '');
}

function detectType(filePath: string): string {
  const extension = path.extname(filePath).substring(1);
  return FILETYPE_BY_EXTENSION[unquoted(extension)] ?? DEFAULT_FILETYPE;
}

function defaultExtension(fileRef: PbxFile): string | undefined {
  const filetype =
    fileRef.lastKnownFileType && fileRef.lastKnownFileType !== DEFAULT_FILETYPE
      ? fileRef.lastKnownFileType
      : fileRef.explicitFileType;
  for (const extension in FILETYPE_BY_EXTENSION) {
    if (FILETYPE_BY_EXTENSION[unquoted(extension)] === unquoted(filetype)) return extension;
  }
  return undefined;
}

function defaultEncoding(fileRef: PbxFile): number | undefined {
  const filetype = fileRef.lastKnownFileType || fileRef.explicitFileType;
  return ENCODING_BY_FILETYPE[unquoted(filetype)];
}

function detectGroup(fileRef: PbxFile, opt: any): string {
  const extension = path.extname(fileRef.basename).substring(1);
  const filetype = fileRef.lastKnownFileType || fileRef.explicitFileType;
  const groupName = GROUP_BY_FILETYPE[unquoted(filetype)];
  if (extension === 'xcdatamodeld') return 'Sources';
  if (opt.customFramework && opt.embed)
    return GROUP_BY_FILETYPE['embedded.framework'] ?? DEFAULT_GROUP;
  return groupName ?? DEFAULT_GROUP;
}

function detectSourcetree(fileRef: PbxFile): string {
  const filetype = fileRef.lastKnownFileType || fileRef.explicitFileType;
  const sourcetree = SOURCETREE_BY_FILETYPE[unquoted(filetype)];
  if (fileRef.explicitFileType) return DEFAULT_PRODUCT_SOURCETREE;
  if (fileRef.customFramework) return DEFAULT_SOURCETREE;
  return sourcetree ?? DEFAULT_SOURCETREE;
}

function defaultPath(fileRef: PbxFile, filePath: string): string {
  const filetype = fileRef.lastKnownFileType || fileRef.explicitFileType;
  const byType = PATH_BY_FILETYPE[unquoted(filetype)];
  if (fileRef.customFramework) return filePath;
  if (byType) return path.join(byType, path.basename(filePath));
  return filePath;
}

export class PbxFile {
  basename: string;
  lastKnownFileType?: string;
  explicitFileType?: string;
  group?: string;
  customFramework?: boolean;
  dirname?: string;
  path?: string;
  fileEncoding?: number;
  defaultEncoding?: number;
  sourceTree: string;
  includeInIndex: number;
  settings?: any;

  // Assigned by the project after construction.
  uuid?: string;
  fileRef?: string;
  target?: string;

  constructor(filepath: string, opt: any = {}) {
    this.basename = path.basename(filepath);
    this.lastKnownFileType = opt.lastKnownFileType || detectType(filepath);
    this.group = detectGroup(this, opt);

    if (opt.customFramework === true) {
      this.customFramework = true;
      this.dirname = path.dirname(filepath).replace(/\\/g, '/');
    }

    this.path = defaultPath(this, filepath).replace(/\\/g, '/');
    this.defaultEncoding = opt.defaultEncoding || defaultEncoding(this);
    this.fileEncoding = this.defaultEncoding;

    if (opt.explicitFileType) {
      this.explicitFileType = opt.explicitFileType;
      this.basename = this.basename + '.' + defaultExtension(this);
      delete this.path;
      delete this.lastKnownFileType;
      delete this.group;
      delete this.defaultEncoding;
    }

    this.sourceTree = opt.sourceTree || detectSourcetree(this);
    this.includeInIndex = 0;

    if (opt.weak === true) this.settings = { ATTRIBUTES: ['Weak'] };

    if (opt.compilerFlags) {
      if (!this.settings) this.settings = {};
      this.settings.COMPILER_FLAGS = `"${opt.compilerFlags}"`;
    }

    if (opt.embed && opt.sign) {
      if (!this.settings) this.settings = {};
      if (!this.settings.ATTRIBUTES) this.settings.ATTRIBUTES = [];
      this.settings.ATTRIBUTES.push('CodeSignOnCopy');
    }
  }
}

export default PbxFile;
