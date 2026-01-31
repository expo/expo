/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// using include guards instead of #pragma once due to compile issues
// with MSVC and BUCK
#ifndef HERMES_INSPECTOR_CDPHANDLER_H
#define HERMES_INSPECTOR_CDPHANDLER_H

#include <functional>
#include <memory>
#include <optional>
#include <string>

#include <hermes/hermes.h>
#include <hermes/inspector/RuntimeAdapter.h>

namespace facebook {
namespace hermes {
namespace inspector_modern {
namespace chrome {

using CDPMessageCallbackFunction = std::function<void(const std::string &)>;
using OnUnregisterFunction = std::function<void()>;

class CDPHandlerImpl;

struct State;

/// Utility struct to configure the initial state of the CDP session.
struct INSPECTOR_EXPORT CDPHandlerSessionConfig {
  bool isRuntimeDomainEnabled{false};
};

/// Configuration for the execution context managed by the CDPHandler.
struct INSPECTOR_EXPORT CDPHandlerExecutionContextDescription {
  int32_t id{};
  std::string origin;
  std::string name;
  std::optional<std::string> auxData;
  bool shouldSendNotifications{};
};

/// CDPHandler processes CDP messages between the client and the debugger.
/// It performs no networking or connection logic itself.
/// The CDP Handler is invoked from multiple threads. The locking strategy is
/// to acquire the lock at each entry point into the class, and hold it until
/// the entry function has returned. In practice, these functions fall into 2
/// categories: public functions invoked by the creator of this instance, and
/// callbacks invoked by the runtime to report events.
/// Once the lock is held, most members are safe to use from any thread, with
/// the notable exception of the runtime (and debugger retrieved from the
/// runtime). Most runtime methods must only be invoked when running on the
/// runtime thread, which occurs in the CDP Handler constructor/destructor, and
/// callbacks from the runtime thread (e.g. host functions, instrumentation
/// callbacks, and pause callback).
class INSPECTOR_EXPORT CDPHandler {
  /// Hide the constructor so users can only construct via static create
  /// methods.
  CDPHandler(
      std::unique_ptr<RuntimeAdapter> adapter,
      const std::string &title,
      bool waitForDebugger,
      bool processConsoleAPI,
      std::shared_ptr<State> state,
      const CDPHandlerSessionConfig &sessionConfig,
      std::optional<CDPHandlerExecutionContextDescription>
          executionContextDescription);

 public:
  /// Creating a CDPHandler enables the debugger on the provided runtime. This
  /// should generally called before you start running any JS in the runtime.
  /// This should also be called on the runtime thread, as methods are invoked
  /// on the given \p adapter.
  static std::shared_ptr<CDPHandler> create(
      std::unique_ptr<RuntimeAdapter> adapter,
      bool waitForDebugger = false,
      bool processConsoleAPI = true,
      std::shared_ptr<State> state = nullptr,
      const CDPHandlerSessionConfig &sessionConfig = {},
      std::optional<CDPHandlerExecutionContextDescription>
          executionContextDescription = std::nullopt);
  /// Temporarily kept to allow React Native build to still work
  static std::shared_ptr<CDPHandler> create(
      std::unique_ptr<RuntimeAdapter> adapter,
      const std::string &title,
      bool waitForDebugger = false,
      bool processConsoleAPI = true,
      std::shared_ptr<State> state = nullptr,
      const CDPHandlerSessionConfig &sessionConfig = {},
      std::optional<CDPHandlerExecutionContextDescription>
          executionContextDescription = std::nullopt);
  ~CDPHandler();

  /// getTitle returns the name of the friendly name of the runtime that's shown
  /// to users in the CDP frontend (e.g. Chrome DevTools).
  std::string getTitle() const;

  /// Provide a callback to receive replies and notifications from the debugger,
  /// and optionally provide a function to be called during
  /// unregisterCallbacks().
  /// \param msgCallback Function to receive replies and notifications from the
  ///     debugger
  /// \param onDisconnect Function that will be invoked upon calling
  ///     unregisterCallbacks
  /// \return true if there wasn't a previously registered callback
  bool registerCallbacks(
      CDPMessageCallbackFunction msgCallback,
      OnUnregisterFunction onUnregister);

  /// Unregister any previously registered callbacks.
  /// \return true if there were previously registered callbacks
  bool unregisterCallbacks();

  /// Process a JSON-encoded Chrome DevTools Protocol request.
  void handle(std::string str);

  /// Extract state to be persisted across reloads.
  std::unique_ptr<State> getState();

 private:
  std::shared_ptr<CDPHandlerImpl> impl_;
  const std::string title_;
};

/// Public-facing wrapper for internal CDP state that can be preserved across
/// reloads.
struct INSPECTOR_EXPORT State {
  /// Incomplete type that stores the actual state.
  struct Private;

  /// Create a new wrapper with the provided \p privateState.
  explicit State(std::unique_ptr<Private> privateState);
  ~State();

  /// Get the wrapped state.
  Private &get() {
    return *privateState_.get();
  }

 private:
  /// Pointer to the actual stored state, hidden from users of this wrapper.
  std::unique_ptr<Private> privateState_;
};

} // namespace chrome
} // namespace inspector_modern
} // namespace hermes
} // namespace facebook

#endif // HERMES_INSPECTOR_CDPHandler_H
