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

#include "rsocket/statemachine/FireAndForgetResponder.h"

namespace rsocket {

using namespace yarpl::flowable;

void FireAndForgetResponder::handlePayload(
    Payload&& payload,
    bool /*flagsComplete*/,
    bool /*flagsNext*/,
    bool flagsFollows) {
  payloadFragments_.addPayloadIgnoreFlags(std::move(payload));

  if (flagsFollows) {
    // there will be more fragments to come
    return;
  }

  Payload finalPayload = payloadFragments_.consumePayloadIgnoreFlags();
  onNewStreamReady(
      StreamType::FNF,
      std::move(finalPayload),
      std::shared_ptr<Subscriber<Payload>>(nullptr));
  removeFromWriter();
}

void FireAndForgetResponder::handleCancel() {
  removeFromWriter();
}

} // namespace rsocket
