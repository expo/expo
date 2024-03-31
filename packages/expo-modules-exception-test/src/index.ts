// Import the native module. On web, it will be resolved to ExpoModulesExceptionTest.web.ts
// and on native platforms to ExpoModulesExceptionTest.ts
import ExpoModulesExceptionTestModule from './ExpoModulesExceptionTestModule';

export function codedException(): string {
  return ExpoModulesExceptionTestModule.codedException();
}

export async function codedExceptionRejectAsync() {
  return await ExpoModulesExceptionTestModule.codedExceptionRejectAsync();
}

export async function codedExceptionThrowAsync() {
  return await ExpoModulesExceptionTestModule.codedExceptionThrowAsync();
}

export async function codedExceptionConcurrentAsync() {
  return await ExpoModulesExceptionTestModule.codedExceptionConcurrentAsync();
}
