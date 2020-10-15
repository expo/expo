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

#include "yarpl/flowable/Flowable.h"

namespace yarpl {
namespace flowable {
namespace details {

template <typename T, typename FlowableFactory>
class DeferFlowable : public Flowable<T> {
  static_assert(
      std::is_same<std::decay_t<FlowableFactory>, FlowableFactory>::value,
      "undecayed");

 public:
  template <typename F>
  explicit DeferFlowable(F&& factory) : factory_(std::forward<F>(factory)) {}

  virtual void subscribe(std::shared_ptr<Subscriber<T>> subscriber) {
    std::shared_ptr<Flowable<T>> flowable;
    try {
      flowable = factory_();
    } catch (const std::exception& ex) {
      flowable = Flowable<T>::error(ex, std::current_exception());
    }
    flowable->subscribe(std::move(subscriber));
  }

 private:
  FlowableFactory factory_;
};

} // namespace details
} // namespace flowable
} // namespace yarpl
