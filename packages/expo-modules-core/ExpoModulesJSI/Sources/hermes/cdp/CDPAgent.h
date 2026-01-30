/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_CDPAGENT_H
#define HERMES_CDP_CDPAGENT_H

#include <atomic>
#include <string>

#include <hermes/AsyncDebuggerAPI.h>
#include <hermes/Public/HermesExport.h>
#include <hermes/RuntimeTaskRunner.h>
#include <hermes/hermes.h>

class CDPAgentTest;

namespace facebook {
namespace hermes {
namespace cdp {

using OutboundMessageFunc = std::function<void(const std::string &)>;

class CDPAgentImpl;
class CDPDebugAPI;

/// Public-facing wrapper for internal CDP state that can be preserved across
/// reloads.
struct HERMES_EXPORT State {
  /// Incomplete type that stores the actual state.
  struct Private;

  /// Create a new empty wrapper.
  State();
  /// Create a new wrapper with the provided \p privateState.
  explicit State(std::unique_ptr<Private> privateState);

  State(const State &other) = delete;
  State &operator=(const State &other) = delete;
  State(State &&other) noexcept;
  State &operator=(State &&other) noexcept;
  ~State();

  inline operator bool() const {
    return privateState_ != nullptr;
  }

  /// Get the wrapped state.
  inline Private &operator*() {
    return *privateState_.get();
  }

  /// Get the wrapped state.
  inline Private *operator->() {
    return privateState_.get();
  }

 private:
  /// Pointer to the actual stored state, hidden from users of this wrapper.
  std::unique_ptr<Private> privateState_;
};

/// An agent for interacting with the provided \p runtime and
/// \p asyncDebuggerAPI via CDP messages in the Debugger, Runtime, Profiler,
/// HeapProfiler domains.
/// The integrator of the agent is expected to manage a queue of tasks to be
/// executed with exclusive access to the runtime (i.e. executed when
/// JavaScript is not running). Tasks to be run are delivered to the integrator
/// via the provided \p enqueueRuntimeTaskCallback, and should be executed in
/// order, at the first opportunity between evaluating JavaScript.
/// The integrator can deliver CDP commands to the agent via the
/// \p handleCommand method. When a CDP response or event is generated, it will
/// be delivered to the integrator via the provided \p messageCallback.
/// Both callbacks may be invoked from arbitrary threads.
class HERMES_EXPORT CDPAgent {
  friend class ::CDPAgentTest;

  /// Hide the constructor so users can only construct via static create
  /// methods.
  CDPAgent(
      int32_t executionContextID,
      CDPDebugAPI &cdpDebugAPI,
      debugger::EnqueueRuntimeTaskFunc enqueueRuntimeTaskCallback,
      OutboundMessageFunc messageCallback,
      State state,
      std::shared_ptr<std::atomic_bool> destroyedDomainAgents);

 public:
  /// Create a new CDP Agent. This can be done on an arbitrary thread; the
  /// runtime will not be accessed during execution of this function.
  static std::unique_ptr<CDPAgent> create(
      int32_t executionContextID,
      CDPDebugAPI &cdpDebugAPI,
      debugger::EnqueueRuntimeTaskFunc enqueueRuntimeTaskCallback,
      OutboundMessageFunc messageCallback,
      State state = {});

  /// Destroy the CDP Agent. This can be done on an arbitrary thread.
  /// It's expected that the integrator will continue to process any runtime
  /// tasks enqueued during destruction.
  ~CDPAgent();

  /// This function can be called from arbitrary threads. It processes a CDP
  /// command encoded in \p json as UTF-8 in accordance with RFC-8259. See:
  // https://chromium.googlesource.com/chromium/src/+/master/third_party/blink/public/devtools_protocol/#wire-format_strings-and-binary-values
  void handleCommand(std::string json);

  /// Enable the Runtime domain without processing a CDP command or sending a
  /// CDP response. This can be called from arbitrary threads.
  void enableRuntimeDomain();

  /// Enable the Debugger domain without processing a CDP command or sending a
  /// CDP response. This can be called from arbitrary threads.
  void enableDebuggerDomain();

  /// Extract state to be persisted across reloads. This can be called from
  /// arbitrary threads.
  State getState();

 private:
  /// This should be a unique_ptr to provide predictable destruction time lined
  /// up with when CDPAgent is destroyed. Do not use shared_ptr.
  std::unique_ptr<CDPAgentImpl> impl_;
};

} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_CDPAGENT_H
