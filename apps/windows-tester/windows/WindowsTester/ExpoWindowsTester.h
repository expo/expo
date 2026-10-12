#pragma once

// C functions exported by the Swift DLL in `apps/windows-tester/swift`. MSVC can't read the header
// that the Swift compiler generates, so they are declared here by hand.

extern "C" {

// Runs a scheduled task on the JavaScript thread.
typedef void (*ExpoWindowsTesterTask)(void *taskContext);

// Posts `task(taskContext)` to the JavaScript thread.
typedef void (*ExpoWindowsTesterPost)(void *hostContext, ExpoWindowsTesterTask task, void *taskContext);

// Installs `globalThis.expoTester` into `runtime` (a `facebook::jsi::Runtime *`). Call it on the
// JavaScript thread.
__declspec(dllimport) bool expo_windows_tester_install(void *runtime, void *hostContext, ExpoWindowsTesterPost post);
}
