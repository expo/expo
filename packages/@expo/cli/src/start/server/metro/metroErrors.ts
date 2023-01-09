// Used to cast a type to metro errors without depending on specific versions of metro.

export type FileAndDirCandidates = {
  dir: FileCandidates;
  file: FileCandidates;
};

/**
 * This is a way to describe what files we tried to look for when resolving
 * a module name as file. This is mainly used for error reporting, so that
 * we can explain why we cannot resolve a module.
 */
export type FileCandidates =
  // We only tried to resolve a specific asset.
  | { type: 'asset'; name: string }
  // We attempted to resolve a name as being a source file (ex. JavaScript,
  // JSON...), in which case there can be several extensions we tried, for
  // example `/js/foo.ios.js`, `/js/foo.js`, etc. for a single prefix '/js/foo'.
  | {
      type: 'sourceFile';
      filePathPrefix: string;
      candidateExts: readonly string[];
    };

type FailedToResolveNameError = Error & {
  dirPaths: string[];
  extraPaths: string[];
};

type FailedToResolvePathError = Error & {
  candidates: FileAndDirCandidates;
};

export function isFailedToResolveNameError(error: any): error is FailedToResolveNameError {
  return !!error && 'extraPaths' in error && error.constructor.name === 'FailedToResolveNameError';
}

export function isFailedToResolvePathError(error: any): error is FailedToResolvePathError {
  return !!error && 'candidates' in error && error.constructor.name === 'FailedToResolvePathError';
}
