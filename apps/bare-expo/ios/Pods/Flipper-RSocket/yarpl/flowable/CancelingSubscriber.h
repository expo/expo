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

#pragma once

#include "yarpl/flowable/Subscriber.h"

#include <stdexcept>

namespace yarpl {
namespace flowable {

/**
 * A Subscriber that always cancels the subscription passed to it.
 */
template <typename T>
class CancelingSubscriber final : public BaseSubscriber<T> {
 public:
  void onSubscribeImpl() override {
    this->cancel();
  }

  void onNextImpl(T) override {
    throw std::logic_error{"CancelingSubscriber::onNext() can never be called"};
  }
  void onCompleteImpl() override {
    throw std::logic_error{
        "CancelingSubscriber::onComplete() can never be called"};
  }
  void onErrorImpl(folly::exception_wrapper) override {
    throw std::logic_error{
        "CancelingSubscriber::onError() can never be called"};
  }
};
} // namespace flowable
} // namespace yarpl
