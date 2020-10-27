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

#include "rsocket/statemachine/ConsumerBase.h"

namespace rsocket {

/// Implementation of stream stateMachine that represents a Stream requester
class StreamRequester : public ConsumerBase {
 public:
  StreamRequester(
      std::shared_ptr<StreamsWriter> writer,
      StreamId streamId,
      Payload payload)
      : ConsumerBase(std::move(writer), streamId),
        initialPayload_(std::move(payload)) {}

  void setRequested(size_t);

  void request(int64_t) override;
  void cancel() override;

  void handlePayload(
      Payload&& payload,
      bool flagsComplete,
      bool flagsNext,
      bool flagsFollows) override;
  void handleError(folly::exception_wrapper ew) override;

 private:
  /// Payload to be sent with the first request.
  Payload initialPayload_;

  /// Whether request() has been called.
  bool requested_{false};
};

} // namespace rsocket
