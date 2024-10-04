/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0MainRunLoopEventBeat.h"

#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>
#import <mutex>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

MainRunLoopEventBeat::MainRunLoopEventBeat(EventBeat::SharedOwnerBox const &ownerBox, RuntimeExecutor runtimeExecutor)
    : EventBeat(ownerBox), runtimeExecutor_(std::move(runtimeExecutor))
{
  mainRunLoopObserver_ = CFRunLoopObserverCreateWithHandler(
      NULL /* allocator */,
      kCFRunLoopBeforeWaiting /* activities */,
      true /* repeats */,
      0 /* order */,
      ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
        if (!this->isRequested_) {
          return;
        }

        this->lockExecutorAndBeat();
      });

  assert(mainRunLoopObserver_);

  CFRunLoopAddObserver(CFRunLoopGetMain(), mainRunLoopObserver_, kCFRunLoopCommonModes);
}

MainRunLoopEventBeat::~MainRunLoopEventBeat()
{
  CFRunLoopRemoveObserver(CFRunLoopGetMain(), mainRunLoopObserver_, kCFRunLoopCommonModes);
  CFRelease(mainRunLoopObserver_);
}

void MainRunLoopEventBeat::induce() const
{
  if (!this->isRequested_) {
    return;
  }

  ABI42_0_0RCTExecuteOnMainQueue(^{
    this->lockExecutorAndBeat();
  });
}

void MainRunLoopEventBeat::lockExecutorAndBeat() const
{
  auto owner = ownerBox_->owner.lock();
  if (!owner) {
    return;
  }

  executeSynchronouslyOnSameThread_CAN_DEADLOCK(runtimeExecutor_, [this](jsi::Runtime &runtime) { beat(runtime); });
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
