// Shared with EAS CLI. Capture the inherited command before marking this CLI's children.
// Only command names are included, never arguments or project paths.
export const parentCommand = process.env.EXPO_PARENT_COMMAND || null;

export function setCliCommand(command: string) {
  process.env.EXPO_PARENT_COMMAND = command;
}
