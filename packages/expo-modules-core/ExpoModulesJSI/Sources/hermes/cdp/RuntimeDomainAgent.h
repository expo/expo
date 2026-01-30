/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_RUNTIMEDOMAINAGENT_H
#define HERMES_CDP_RUNTIMEDOMAINAGENT_H

#include <optional>

#include "CDPDebugAPI.h"
#include "DomainAgent.h"
#include "RemoteObjectConverters.h"

namespace facebook {
namespace hermes {
namespace cdp {

namespace m = ::facebook::hermes::cdp::message;

/// Handler for the "Runtime" domain of CDP. Accepts CDP requests belonging to
/// the "Runtime" domain from the debug client. Produces CDP responses and
/// events belonging to the "Runtime" domain. All methods expect to be invoked
/// with exclusive access to the runtime.
class RuntimeDomainAgent : public DomainAgent {
 public:
  RuntimeDomainAgent(
      int32_t executionContextID,
      HermesRuntime &runtime,
      debugger::AsyncDebuggerAPI &asyncDebuggerAPI,
      SynchronizedOutboundCallback messageCallback,
      std::shared_ptr<RemoteObjectsTable> objTable,
      ConsoleMessageStorage &consoleMessageStorage,
      ConsoleMessageDispatcher &consoleMessageDispatcher);
  ~RuntimeDomainAgent();

  /// Enables the Runtime domain without processing CDP message or sending a CDP
  /// response. It will still send CDP notifications if needed.
  void enable();
  /// Handles Runtime.enable request
  /// @cdp Runtime.enable If domain is already enabled, will return success.
  void enable(const m::runtime::EnableRequest &req);
  /// @cdp Runtime.discardConsoleEntries
  void discardConsoleEntries(
      const m::runtime::DiscardConsoleEntriesRequest &req);
  /// Handles Runtime.disable request
  /// @cdp Runtime.disable If domain is already disabled, will return success.
  void disable(const m::runtime::DisableRequest &req);
  /// Handles Runtime.getHeapUsage request
  /// @cdp Runtime.getHeapUsage Allowed even if domain is not enabled.
  void getHeapUsage(const m::runtime::GetHeapUsageRequest &req);
  /// Handles Runtime.globalLexicalScopeNames request
  /// @cdp Runtime.globalLexicalScopeNames Allowed even if domain is not
  /// enabled.
  void globalLexicalScopeNames(
      const m::runtime::GlobalLexicalScopeNamesRequest &req);
  /// Handles Runtime.compileScript request
  /// @cdp Runtime.compileScript Not allowed if domain is not enabled.
  void compileScript(const m::runtime::CompileScriptRequest &req);
  /// Handles Runtime.getProperties request
  /// @cdp Runtime.getProperties Allowed even if domain is not enabled.
  void getProperties(const m::runtime::GetPropertiesRequest &req);
  /// Handles Runtime.evaluate request
  /// @cdp Runtime.evaluate Allowed even if domain is not enabled.
  void evaluate(const m::runtime::EvaluateRequest &req);
  /// Handles Runtime.callFunctionOn request
  /// @cdp Runtime.callFunctionOn Allowed even if domain is not enabled.
  void callFunctionOn(const m::runtime::CallFunctionOnRequest &req);
  /// Dispatches a Runtime.consoleAPICalled notification
  void consoleAPICalled(const ConsoleMessage &message, bool isBuffered);
  /// Handles Runtime.releaseObject request
  /// @cdp Runtime.releaseObject Allowed even if domain is not enabled.
  void releaseObject(const m::runtime::ReleaseObjectRequest &req);
  /// Handles Runtime.releaseObjectGroup request
  /// @cdp Runtime.releaseObjectGroup Allowed even if domain is not enabled.
  void releaseObjectGroup(const m::runtime::ReleaseObjectGroupRequest &req);

 private:
  struct Helpers {
    jsi::Function objectGetOwnPropertySymbols;
    jsi::Function objectGetOwnPropertyNames;
    jsi::Function objectGetOwnPropertyDescriptor;
    jsi::Function objectGetPrototypeOf;

    explicit Helpers(jsi::Runtime &runtime);
  };

  bool checkRuntimeEnabled(const m::Request &req);

  /// Ensure the provided \p executionContextId matches the one
  /// indicated via the constructor. Returns true if they match.
  /// Sends an error message with the specified \p commandId
  /// and returns false otherwise.
  bool validateExecutionContextId(
      m::runtime::ExecutionContextId executionContextId,
      long long commandId);

  std::optional<std::vector<m::runtime::PropertyDescriptor>> makePropsFromScope(
      std::pair<uint32_t, uint32_t> frameAndScopeIndex,
      const std::string &objectGroup,
      const debugger::ProgramState &state,
      const ObjectSerializationOptions &serializationOptions);
  std::vector<m::runtime::PropertyDescriptor> makePropsFromValue(
      const jsi::Value &value,
      const std::string &objectGroup,
      bool onlyOwnProperties,
      bool accessorPropertiesOnly,
      const ObjectSerializationOptions &serializationOptions);
  std::vector<m::runtime::InternalPropertyDescriptor>
  makeInternalPropsFromValue(
      const jsi::Value &value,
      const std::string &objectGroup,
      const ObjectSerializationOptions &serializationOptions);

  HermesRuntime &runtime_;
  debugger::AsyncDebuggerAPI &asyncDebuggerAPI_;
  ConsoleMessageStorage &consoleMessageStorage_;
  ConsoleMessageDispatcher &consoleMessageDispatcher_;

  /// Whether Runtime.enable was received and wasn't disabled by receiving
  /// Runtime.disable
  bool enabled_;

  // preparedScripts_ stores user-entered scripts that have been prepared for
  // execution, and may be invoked by a later command.
  std::vector<std::shared_ptr<const jsi::PreparedJavaScript>> preparedScripts_;

  /// Console message subscription token, used to unsubscribe during shutdown.
  ConsoleMessageRegistration consoleMessageRegistration_;

  /// Cached helper JS functions used by agent methods.
  const Helpers helpers_;
};

} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_RUNTIMEDOMAINAGENT_H
