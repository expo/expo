/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_CDPDEBUGAPI_H
#define HERMES_CDP_CDPDEBUGAPI_H

#include <hermes/AsyncDebuggerAPI.h>

#include "ConsoleMessage.h"

namespace facebook {
namespace hermes {
namespace cdp {

class CDPAgentImpl;

/// Storage and interfaces for carrying out a CDP debug session. Contains
/// information and operations that correspond to a single runtime being
/// debugged, independent of any particular CDPAgent.
class HERMES_EXPORT CDPDebugAPI {
 public:
  /// Create a new CDPDebugAPI instance. The provided runtime must remain valid
  /// until the returned CDPDebugAPI is destroyed.
  static std::unique_ptr<CDPDebugAPI> create(
      HermesRuntime &runtime,
      size_t maxCachedMessages = kMaxCachedConsoleMessages);
  ~CDPDebugAPI();

  /// Gets the runtime originally passed into this instance.
  HermesRuntime &runtime() {
    return runtime_;
  }

  /// Gets the AsyncDebuggerAPI associated with this instance.
  debugger::AsyncDebuggerAPI &asyncDebuggerAPI() {
    return *asyncDebuggerAPI_;
  }

  /// Adds a console message to the current CDPDebugAPI instance,
  /// broadcasting it to all current agents, and storing it for
  /// future agents (within buffer limitations). This function
  /// must only be called from the runtime thread.
  void addConsoleMessage(ConsoleMessage message);

 private:
  /// Allow CDPAgentImpl (but not integrators) to access
  /// consoleMessageStorage_.
  friend class CDPAgentImpl;

  CDPDebugAPI(HermesRuntime &runtime, size_t maxCachedMessages);

  HermesRuntime &runtime_;
  std::unique_ptr<debugger::AsyncDebuggerAPI> asyncDebuggerAPI_;
  ConsoleMessageStorage consoleMessageStorage_;
  ConsoleMessageDispatcher consoleMessageDispatcher_;
};

} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_CDPDEBUGAPI_H
