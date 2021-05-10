/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <CoreFoundation/CFRunLoop.h>
#include <CoreFoundation/CoreFoundation.h>
#include <ABI41_0_0React/core/EventBeat.h>
#include <ABI41_0_0React/utils/RuntimeExecutor.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/*
 * Event beat associated with JavaScript runtime.
 * The beat is called on `RuntimeExecutor`'s thread induced by the main thread
 * event loop.
 */
class RuntimeEventBeat : public EventBeat {
 public:
  RuntimeEventBeat(
      EventBeat::SharedOwnerBox const &ownerBox,
      RuntimeExecutor runtimeExecutor);
  ~RuntimeEventBeat();

  void induce() const override;

 private:
  const RuntimeExecutor runtimeExecutor_;
  CFRunLoopObserverRef mainRunLoopObserver_;
  mutable std::atomic<bool> isBusy_{false};
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
