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

#include "rsocket/statemachine/StreamStateMachineBase.h"
#include "yarpl/flowable/Subscriber.h"
#include "yarpl/single/SingleObserver.h"
#include "yarpl/single/SingleSubscription.h"

namespace rsocket {

/// Helper class for handling receiving fragmented payload
class FireAndForgetResponder : public StreamStateMachineBase {
 public:
  FireAndForgetResponder(
      std::shared_ptr<StreamsWriter> writer,
      StreamId streamId)
      : StreamStateMachineBase(std::move(writer), streamId) {}

  void handlePayload(
      Payload&& payload,
      bool flagsComplete,
      bool flagsNext,
      bool flagsFollows) override;

 private:
  void handleCancel() override;
};
} // namespace rsocket
