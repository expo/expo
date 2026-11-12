// EAS CLI uses the same variable name and the same `<cli> <command>` value. Do not change them.
const COMMAND_PATTERN = /^(expo|eas) [\w:-]+$/;

// Read the inherited value on load, before `markAsParentCommand` replaces it.
const inheritedCommand = process.env.EXPO_PARENT_COMMAND ?? '';

/** The Expo CLI or EAS CLI command that started this process. Any other value is dropped. */
export const parentCommand = COMMAND_PATTERN.test(inheritedCommand) ? inheritedCommand : undefined;

export function markAsParentCommand(command: string) {
  process.env.EXPO_PARENT_COMMAND = command;
}
