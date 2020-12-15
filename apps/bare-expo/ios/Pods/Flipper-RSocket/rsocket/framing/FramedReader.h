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

#include <folly/io/IOBufQueue.h>

#include "rsocket/DuplexConnection.h"
#include "rsocket/framing/ProtocolVersion.h"
#include "rsocket/internal/Allowance.h"
#include "yarpl/flowable/Subscription.h"

namespace rsocket {

class FramedReader : public DuplexConnection::Subscriber,
                     public yarpl::flowable::Subscription,
                     public std::enable_shared_from_this<FramedReader> {
 public:
  explicit FramedReader(std::shared_ptr<ProtocolVersion> version)
      : version_{std::move(version)} {}

  /// Set the inner subscriber which will be getting full frame payloads.
  void setInput(std::shared_ptr<DuplexConnection::Subscriber>);

  /// Cancel the subscription and error the inner subscriber.
  void error(std::string);

  // Subscriber.

  void onSubscribe(std::shared_ptr<yarpl::flowable::Subscription>) override;
  void onNext(std::unique_ptr<folly::IOBuf>) override;
  void onComplete() override;
  void onError(folly::exception_wrapper) override;

  // Subscription.

  void request(int64_t) override;
  void cancel() override;

 private:
  void parseFrames();
  bool ensureOrAutodetectProtocolVersion();

  size_t readFrameLength() const;

  std::shared_ptr<yarpl::flowable::Subscription> subscription_;
  std::shared_ptr<DuplexConnection::Subscriber> inner_;

  Allowance allowance_;
  bool dispatchingFrames_{false};

  folly::IOBufQueue payloadQueue_{folly::IOBufQueue::cacheChainLength()};
  const std::shared_ptr<ProtocolVersion> version_;
};

} // namespace rsocket
