/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/futures/ThreadWheelTimekeeper.h>
#include <folly/futures/WTCallback.h>

#include <folly/Chrono.h>
#include <folly/Singleton.h>
#include <folly/futures/Future.h>
#include <future>

namespace folly {

namespace {
Singleton<ThreadWheelTimekeeper> timekeeperSingleton_;
}

ThreadWheelTimekeeper::ThreadWheelTimekeeper()
    : thread_([this] { eventBase_.loopForever(); }),
      wheelTimer_(
          HHWheelTimer::newTimer(&eventBase_, std::chrono::milliseconds(1))) {
  eventBase_.waitUntilRunning();
  eventBase_.runInEventBaseThread([this] {
    // 15 characters max
    eventBase_.setName("FutureTimekeepr");
  });
}

ThreadWheelTimekeeper::~ThreadWheelTimekeeper() {
  eventBase_.runInEventBaseThreadAndWait([this] {
    wheelTimer_->cancelAll();
    eventBase_.terminateLoopSoon();
  });
  thread_.join();
}

SemiFuture<Unit> ThreadWheelTimekeeper::after(HighResDuration dur) {
  auto cob = WTCallback<HHWheelTimer>::create(&eventBase_);
  auto f = cob->getSemiFuture();
  //
  // Even shared_ptr of cob is captured in lambda this is still somewhat *racy*
  // because it will be released once timeout is scheduled. So technically there
  // is no gurantee that EventBase thread can safely call timeout callback.
  // However due to fact that we are having circular reference here:
  // WTCallback->Promise->Core->WTCallbak, so three of them won't go away until
  // we break the circular reference. The break happens either in
  // WTCallback::timeoutExpired or WTCallback::interruptHandler. Former means
  // timeout callback is being safely executed. Latter captures shared_ptr of
  // WTCallback again in another lambda for canceling timeout. The moment
  // canceling timeout is executed in EventBase thread, the actual timeout
  // callback has either been executed, or will never be executed. So we are
  // fine here.
  //
  eventBase_.runInEventBaseThread([this, cob, dur] {
    wheelTimer_->scheduleTimeout(cob.get(), folly::chrono::ceil<Duration>(dur));
  });
  return f;
}

namespace detail {

std::shared_ptr<Timekeeper> getTimekeeperSingleton() {
  return timekeeperSingleton_.try_get();
}

} // namespace detail

} // namespace folly
