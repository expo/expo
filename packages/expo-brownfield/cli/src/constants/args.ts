import arg, { type Spec } from 'arg';

/**
 * General CLI arguments
 */
const generalArgs: Spec = {
  // Types
  '--help': arg.COUNT,
  '--version': arg.COUNT,
  // Aliases
  '-h': '--help',
  '-v': '--version',
} as const;

/**
 * Common build arguments shared by Android and iOS
 */
const buildCommonArgs: Spec = {
  // Types
  '--debug': arg.COUNT,
  '--help': arg.COUNT,
  '--release': arg.COUNT,
  '--verbose': arg.COUNT,
  // Aliases
  '-d': '--debug',
  '-h': '--help',
  '-r': '--release',
};

/**
 * Android build arguments
 */
const buildAndroidArgs: Spec = {
  // Inherited
  ...buildCommonArgs,
  // Types
  '--all': arg.COUNT,
  '--library': String,
  '--repository': [String],
  '--task': [String],
  // Aliases
  '-a': '--all',
  '-l': '--library',
  '--repo': '--repository',
  '-t': '--task',
};

/**
 * Android tasks arguments
 */
const tasksAndroidArgs: Spec = {
  // Types
  '--help': arg.COUNT,
  '--library': String,
  '--verbose': arg.COUNT,
  // Aliases
  '-h': '--help',
  '-l': '--library',
};

/**
 * iOS build arguments
 */
const buildIosArgs: Spec = {
  // Inherited
  ...buildCommonArgs,
  // Types
  '--artifacts': String,
  '--scheme': String,
  '--xcworkspace': String,
  // Aliases
  '-a': '--artifacts',
  '-s': '--scheme',
  '-x': '--xcworkspace',
};

/**
 * CLI arguments
 */
export const Args: Record<string, Spec> = {
  Android: buildAndroidArgs,
  General: generalArgs,
  IOS: buildIosArgs,
  TasksAndroid: tasksAndroidArgs,
};
