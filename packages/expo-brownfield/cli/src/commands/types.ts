export type GeneralCommand = 'help' | 'version';
export type AndroidCommand = 'build-android' | 'tasks-android';
export type IosCommand = 'build-ios';

export type Command = GeneralCommand | AndroidCommand | IosCommand;

export interface CommandEntry {
  run: () => Promise<void>;
}

export type CommandsMap = Record<Command, CommandEntry>;
