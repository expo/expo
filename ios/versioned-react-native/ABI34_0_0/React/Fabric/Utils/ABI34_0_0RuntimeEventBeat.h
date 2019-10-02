/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <CoreFoundation/CFRunLoop.h>
#include <CoreFoundation/CoreFoundation.h>
#include <ReactABI34_0_0/events/EventBeat.h>
#include <ReactABI34_0_0/uimanager/primitives.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Event beat associated with JavaScript runtime.
 * The beat is called on `RuntimeExecutor`'s thread induced by the main thread
 * event loop.
 */
class RuntimeEventBeat : public EventBeat {
 public:
  RuntimeEventBeat(RuntimeExecutor runtimeExecutor);
  ~RuntimeEventBeat();

  void induce() const override;

 private:
  const RuntimeExecutor runtimeExecutor_;
  CFRunLoopObserverRef mainRunLoopObserver_;
  mutable std::atomic<bool> isBusy_{false};
};

} // namespace ReactABI34_0_0
} // namespace facebook
