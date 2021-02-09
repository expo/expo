// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include "SwappableEventBase.h"

namespace rsocket {

bool SwappableEventBase::runInEventBaseThread(CbFunc cb) {
  const std::lock_guard<std::mutex> l(hasSebDtored_->l_);

  if (this->isSwapping()) {
    queued_.push_back(std::move(cb));
    return false;
  }

  eb_->runInEventBaseThread(
      [eb = eb_, cb_ = std::move(cb)]() mutable { return cb_(*eb); });

  return true;
}

void SwappableEventBase::setEventBase(folly::EventBase& newEb) {
  const std::lock_guard<std::mutex> l(hasSebDtored_->l_);

  auto const alreadySwapping = this->isSwapping();
  nextEb_ = &newEb;
  if (alreadySwapping) {
    return;
  }

  eb_->runInEventBaseThread([this, hasSebDtored = hasSebDtored_]() {
    const std::lock_guard<std::mutex> lInner(hasSebDtored->l_);
    if (hasSebDtored->destroyed_) {
      // SEB was destroyed, any queued callbacks were appended to the old eb_
      return;
    }

    eb_ = nextEb_;
    nextEb_ = nullptr;

    // enqueue tasks that were being buffered while this was waiting
    // for the previous EB to drain
    for (auto& cb : queued_) {
      eb_->runInEventBaseThread(
          [cb = std::move(cb), eb = eb_]() mutable { return cb(*eb); });
    }

    queued_.clear();
  });
}

bool SwappableEventBase::isSwapping() const {
  return nextEb_ != nullptr;
}

SwappableEventBase::~SwappableEventBase() {
  const std::lock_guard<std::mutex> l(hasSebDtored_->l_);

  hasSebDtored_->destroyed_ = true;
  for (auto& cb : queued_) {
    eb_->runInEventBaseThread(
        [cb = std::move(cb), eb = eb_]() mutable { return cb(*eb); });
  }
  queued_.clear();
}

} /* namespace rsocket */
