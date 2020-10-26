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

#include "rsocket/tck-test/BaseSubscriber.h"

#include "yarpl/Flowable.h"

namespace rsocket {
namespace tck {

class FlowableSubscriber : public BaseSubscriber,
                           public yarpl::flowable::Subscriber<Payload> {
 public:
  explicit FlowableSubscriber(int initialRequestN = 0);

  // Inherited from BaseSubscriber
  void request(int n) override;
  void cancel() override;

 protected:
  // Inherited from flowable::Subscriber
  void onSubscribe(std::shared_ptr<yarpl::flowable::Subscription>
                       subscription) noexcept override;
  void onNext(Payload element) noexcept override;
  void onComplete() noexcept override;
  void onError(folly::exception_wrapper ex) noexcept override;

 private:
  std::shared_ptr<yarpl::flowable::Subscription> subscription_;
  int initialRequestN_{0};
};

} // namespace tck
} // namespace rsocket
