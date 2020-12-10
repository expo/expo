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

#include "yarpl/Single.h"

namespace rsocket {
namespace tck {

class SingleSubscriber : public BaseSubscriber,
                         public yarpl::single::SingleObserver<Payload> {
 public:
  // Inherited from BaseSubscriber
  void request(int n) override;
  void cancel() override;

 protected:
  // Inherited from flowable::Subscriber
  void onSubscribe(std::shared_ptr<yarpl::single::SingleSubscription>
                       subscription) noexcept override;
  void onSuccess(Payload element) noexcept override;
  void onError(folly::exception_wrapper ex) noexcept override;

 private:
  std::shared_ptr<yarpl::single::SingleSubscription> subscription_;
};

} // namespace tck
} // namespace rsocket
