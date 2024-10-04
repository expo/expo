/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0RCTMessageThread.h"

#include <condition_variable>
#include <mutex>

#import <ABI42_0_0React/ABI42_0_0RCTCxxUtils.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>

// A note about the implementation: This class is not used
// generically.  It's a thin wrapper around a run loop which
// implements a C++ interface, for use by the C++ xplat bridge code.
// This means it can make certain non-generic assumptions.  In
// particular, the sync functions are only used for bridge setup and
// teardown, and quitSynchronous is guaranteed to be called.

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

ABI42_0_0RCTMessageThread::ABI42_0_0RCTMessageThread(NSRunLoop *runLoop, ABI42_0_0RCTJavaScriptCompleteBlock errorBlock)
    : m_cfRunLoop([runLoop getCFRunLoop]), m_errorBlock(errorBlock), m_shutdown(false)
{
  CFRetain(m_cfRunLoop);
}

ABI42_0_0RCTMessageThread::~ABI42_0_0RCTMessageThread()
{
  CFRelease(m_cfRunLoop);
}

// This is analogous to dispatch_async
void ABI42_0_0RCTMessageThread::runAsync(std::function<void()> func)
{
  CFRunLoopPerformBlock(m_cfRunLoop, kCFRunLoopCommonModes, ^{
    // Create an autorelease pool each run loop to prevent memory footprint from growing too large, which can lead to
    // performance problems.
    @autoreleasepool {
      func();
    }
  });
  CFRunLoopWakeUp(m_cfRunLoop);
}

// This is analogous to dispatch_sync
void ABI42_0_0RCTMessageThread::runSync(std::function<void()> func)
{
  if (m_cfRunLoop == CFRunLoopGetCurrent()) {
    func();
    return;
  }

  dispatch_semaphore_t sema = dispatch_semaphore_create(0);
  runAsync([func = std::make_shared<std::function<void()>>(std::move(func)), &sema] {
    (*func)();
    dispatch_semaphore_signal(sema);
  });
  dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
}

void ABI42_0_0RCTMessageThread::tryFunc(const std::function<void()> &func)
{
  NSError *error = tryAndReturnError(func);
  if (error) {
    m_errorBlock(error);
  }
}

void ABI42_0_0RCTMessageThread::runOnQueue(std::function<void()> &&func)
{
  if (m_shutdown) {
    return;
  }

  runAsync([this, func = std::make_shared<std::function<void()>>(std::move(func))] {
    if (!m_shutdown) {
      tryFunc(*func);
    }
  });
}

void ABI42_0_0RCTMessageThread::runOnQueueSync(std::function<void()> &&func)
{
  if (m_shutdown) {
    return;
  }
  runSync([this, func = std::move(func)] {
    if (!m_shutdown) {
      tryFunc(func);
    }
  });
}

void ABI42_0_0RCTMessageThread::quitSynchronous()
{
  m_shutdown = true;
  runSync([] {});
  CFRunLoopStop(m_cfRunLoop);
}

void ABI42_0_0RCTMessageThread::setRunLoop(NSRunLoop *runLoop)
{
  CFRelease(m_cfRunLoop);
  m_cfRunLoop = [runLoop getCFRunLoop];
  CFRetain(m_cfRunLoop);
}

}
}
