import type { AndroidCommand, CommandEntry } from './types';
import { Args, Errors } from '../constants';
import { parseArgs } from '../utils';
import { Commands } from './commands';

export const resolveCommand = (): CommandEntry => {
  const args = parseArgs({ spec: Args.General, stopAtPositional: true });

  if (args['--help']) {
    return Commands.help;
  }
  if (args['--version']) {
    return Commands.version;
  }

  const command = args['_']?.length > 0 ? args['_'][0] : '';
  if (command === 'build-android' || command === 'tasks-android') {
    return resolveAndroid(command);
  }
  if (command === 'build-ios') {
    return resolveIos();
  }

  return Errors.unknownCommand();
};

export const resolveAndroid = (command: AndroidCommand): CommandEntry => {
  return Commands[command];
};

export const resolveIos = (): CommandEntry => {
  return Commands['build-ios'];
};
