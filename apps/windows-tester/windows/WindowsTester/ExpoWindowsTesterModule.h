#pragma once

#include <JSI/JsiApiContext.h>
#include <NativeModules.h>

#include <cstdlib>
#include <fstream>
#include <optional>
#include <string>

#include "ExpoWindowsTester.h"

namespace WindowsTester {

// Gives the app's JSI runtime to the Swift DLL. JavaScript calls `install()` once, on the
// JavaScript thread, and then uses `globalThis.expoTester`. `log` and `report` let CI follow the run
// even when the Swift side doesn't work.
REACT_MODULE(ExpoWindowsTesterModule, L"ExpoWindowsTester")
struct ExpoWindowsTesterModule {
  REACT_INIT(Initialize)
  void Initialize(winrt::Microsoft::ReactNative::ReactContext const &context) noexcept {
    m_context = context;
    Log("module initialized");
  }

  REACT_SYNC_METHOD(Install, L"install")
  bool Install() noexcept {
    facebook::jsi::Runtime *runtime = winrt::Microsoft::ReactNative::TryGetOrCreateContextRuntime(m_context);
    if (!runtime) {
      Log("no JSI runtime");
      return false;
    }
    Log("calling expo_windows_tester_install");
    // Lives as long as the process, like the runtime that the Swift DLL keeps.
    auto *callInvoker = new std::shared_ptr<facebook::react::CallInvoker>(m_context.CallInvoker());
    bool installed = expo_windows_tester_install(runtime, callInvoker, &PostToJavaScriptThread);
    Log(installed ? "installed" : "not installed");
    return installed;
  }

  // Sync methods must return a value, so `log` and `report` return whether they wrote the file.
  REACT_SYNC_METHOD(Log, L"log")
  bool Log(std::string message) noexcept {
    auto path = ReadEnvironmentVariable("EXPO_WINDOWS_TESTER_LOG");
    if (!path) {
      return false;
    }
    std::ofstream(*path, std::ios::app) << message << std::endl;
    return true;
  }

  // Writes the results to the file in `EXPO_WINDOWS_TESTER_RESULT` and quits the app.
  REACT_SYNC_METHOD(Report, L"report")
  bool Report(std::string result) noexcept {
    auto path = ReadEnvironmentVariable("EXPO_WINDOWS_TESTER_RESULT");
    if (!path) {
      return false;
    }
    std::ofstream(*path) << result;
    std::exit(0);
  }

 private:
  static std::optional<std::string> ReadEnvironmentVariable(const char *name) noexcept {
    char *value = nullptr;
    size_t length = 0;
    if (_dupenv_s(&value, &length, name) != 0 || !value) {
      return std::nullopt;
    }
    std::string result(value);
    std::free(value);
    return result;
  }

  // Goes through React Native's call invoker rather than the JavaScript dispatcher: the invoker
  // runs the task through the runtime scheduler, which also runs the microtasks (promise
  // callbacks) that the task queues.
  static void PostToJavaScriptThread(void *hostContext, ExpoWindowsTesterTask task, void *taskContext) {
    auto *callInvoker = static_cast<std::shared_ptr<facebook::react::CallInvoker> *>(hostContext);
    (*callInvoker)->invokeAsync([task, taskContext](facebook::jsi::Runtime &) { task(taskContext); });
  }

  winrt::Microsoft::ReactNative::ReactContext m_context;
};

} // namespace WindowsTester
