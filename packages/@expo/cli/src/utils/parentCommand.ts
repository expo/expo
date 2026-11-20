let parentCommand: string | undefined;

/** The Expo CLI or EAS CLI command that started this process. */
export function getParentCommand(): string | undefined {
  return parentCommand;
}

/** Makes child processes report `command` as their parent command. */
export function markAsParentCommand(command: string): string | undefined {
  // EAS CLI uses the same variable name and the same `<cli> <command>` value. Do not change them.
  parentCommand = process.env.__EXPO_PARENT_COMMAND || undefined;
  process.env.__EXPO_PARENT_COMMAND = command;
  return parentCommand;
}
