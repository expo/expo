/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI41_0_0RuntimeEventBeat.h"

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

RuntimeEventBeat::RuntimeEventBeat(EventBeat::SharedOwnerBox const &ownerBox, RuntimeExecutor runtimeExecutor)
    : EventBeat(ownerBox), runtimeExecutor_(std::move(runtimeExecutor))
{
  mainRunLoopObserver_ = CFRunLoopObserverCreateWithHandler(
      NULL /* allocator */,
      kCFRunLoopBeforeWaiting /* activities */,
      true /* repeats */,
      0 /* order */,
      ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
        // Note: We only `induce` beat here; actual beat will be performed on
        // a different thread.
        this->induce();
      });

  assert(mainRunLoopObserver_);

  CFRunLoopAddObserver(CFRunLoopGetMain(), mainRunLoopObserver_, kCFRunLoopCommonModes);
}

RuntimeEventBeat::~RuntimeEventBeat()
{
  CFRunLoopRemoveObserver(CFRunLoopGetMain(), mainRunLoopObserver_, kCFRunLoopCommonModes);
  CFRelease(mainRunLoopObserver_);
}

void RuntimeEventBeat::induce() const
{
  if (!isRequested_ || isBusy_) {
    return;
  }

  isBusy_ = true;
  runtimeExecutor_([this, ownerBox = ownerBox_](jsi::Runtime &runtime) mutable {
    auto owner = ownerBox->owner.lock();
    if (!owner) {
      return;
    }

    this->beat(runtime);
    isBusy_ = false;
  });
}

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
