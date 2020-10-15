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

#include "rsocket/Payload.h"
#include "yarpl/flowable/Subscriber.h"

namespace rsocket {
class PrintSubscriber : public yarpl::flowable::Subscriber<Payload> {
 public:
  ~PrintSubscriber();

  void onSubscribe(std::shared_ptr<yarpl::flowable::Subscription>
                       subscription) noexcept override;
  void onNext(Payload element) noexcept override;
  void onComplete() noexcept override;
  void onError(folly::exception_wrapper ex) noexcept override;
};
} // namespace rsocket
