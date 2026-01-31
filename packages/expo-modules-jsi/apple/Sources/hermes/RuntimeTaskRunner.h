/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_RUNTIMETASKRUNNER_H
#define HERMES_RUNTIMETASKRUNNER_H

#include "AsyncDebuggerAPI.h"

namespace facebook {
namespace hermes {
namespace debugger {

using RuntimeTask = std::function<void(HermesRuntime &)>;
using EnqueueRuntimeTaskFunc = std::function<void(RuntimeTask)>;

enum class TaskQueues {
  All,
  Integrator,
};

/// Helper for users of AsyncDebuggerAPI that makes it easy to find the
/// earliest opportunity to use the runtime. There are two ways to become
/// the exclusive user of the runtime:
/// - Ask the AsyncDebuggerAPI to interrupt execution and provide a reference
///   to the runtime. Interrupting will only succeed when JavaScript is
///   running, so this method won't produce a prompt response if JavaScript is
///   not running.
/// - Ask the owner of the runtime to provide a reference to the runtime. If
///   the owner is currently running JavaScript (e.g. via a call to
///   evaluateJavaScript), this method won't produce a prompt response.
/// To cover both cases (when JavaScript is running, and when JavaScript isn't
/// running), this helper requests the runtime from both sources, executes the
/// task via the first responder, and sets a flag to indicate to the second
/// responder that nothing more needs to be done.
class RuntimeTaskRunner
    : public std::enable_shared_from_this<RuntimeTaskRunner> {
 public:
  RuntimeTaskRunner(
      debugger::AsyncDebuggerAPI &debugger,
      EnqueueRuntimeTaskFunc enqueueRuntimeTaskFunc);
  ~RuntimeTaskRunner();

  /// Schedule a task to be run with access to the runtime at the earliest
  /// opportunity. Before returning, the task is added to the relevant task
  /// queues managed by the \p AsyncDebuggerAPI and/or the intergator, with no
  /// lingering references to the \p RuntimeTaskRunner. Thus, tasks can be
  /// enqueued even if the task runner will be destroyed shortly after.
  void enqueueTask(RuntimeTask task, TaskQueues queues = TaskQueues::All);

 private:
  /// API where the runtime can be obtained when JavaScript is running.
  debugger::AsyncDebuggerAPI &debugger_;

  /// Function provided by the integrator that enqueues a task to be run
  /// when JavaScript is not running.
  EnqueueRuntimeTaskFunc enqueueRuntimeTask_;
};

} // namespace debugger
} // namespace hermes
} // namespace facebook

#endif // HERMES_RUNTIMETASKRUNNER_H
