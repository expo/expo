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

#include <folly/futures/Future.h>
#include <folly/Likely.h>
#include <folly/futures/ThreadWheelTimekeeper.h>

namespace folly {
namespace futures {

SemiFuture<Unit> sleep(HighResDuration dur, Timekeeper* tk) {
  std::shared_ptr<Timekeeper> tks;
  if (LIKELY(!tk)) {
    tks = folly::detail::getTimekeeperSingleton();
    tk = tks.get();
  }

  if (UNLIKELY(!tk)) {
    return makeSemiFuture<Unit>(FutureNoTimekeeper());
  }

  return tk->after(dur);
}

Future<Unit> sleepUnsafe(HighResDuration dur, Timekeeper* tk) {
  return sleep(dur, tk).toUnsafeFuture();
}

#if FOLLY_FUTURE_USING_FIBER

namespace {
template <typename Ptr>
class FutureWaiter : public fibers::Baton::Waiter {
 public:
  FutureWaiter(Promise<Unit> promise, Ptr baton)
      : promise_(std::move(promise)), baton_(std::move(baton)) {
    baton_->setWaiter(*this);
  }

  void post() override {
    promise_.setValue();
    delete this;
  }

 private:
  Promise<Unit> promise_;
  Ptr baton_;
};
} // namespace

SemiFuture<Unit> wait(std::unique_ptr<fibers::Baton> baton) {
  Promise<Unit> promise;
  auto sf = promise.getSemiFuture();
  new FutureWaiter<std::unique_ptr<fibers::Baton>>(
      std::move(promise), std::move(baton));
  return sf;
}
SemiFuture<Unit> wait(std::shared_ptr<fibers::Baton> baton) {
  Promise<Unit> promise;
  auto sf = promise.getSemiFuture();
  new FutureWaiter<std::shared_ptr<fibers::Baton>>(
      std::move(promise), std::move(baton));
  return sf;
}

#endif

} // namespace futures
} // namespace folly
