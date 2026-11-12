// EAS CLI uses the same variable name and the same `<cli> <command>` value. Do not change them.
// Read the inherited value on load, before `markAsParentCommand` replaces it.
/** The Expo CLI or EAS CLI command that started this process. */
export const parentCommand = process.env.EXPO_PARENT_COMMAND || undefined;

export function markAsParentCommand(command: string) {
  process.env.EXPO_PARENT_COMMAND = command;
}
