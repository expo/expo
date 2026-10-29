export function requireTaskManager(callerName: string): typeof import('expo-task-manager') {
  try {
    return require('expo-task-manager');
  } catch {
    throw new Error(
      `${callerName} couldn't define the background task because the 'expo-task-manager' package isn't installed. Background location events are delivered through it. Install it with \`npx expo install expo-task-manager\` and rebuild the app.`
    );
  }
}
