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

#include "rsocket/RSocketServiceHandler.h"

namespace rsocket {

void RSocketServiceHandler::onNewRSocketState(
    std::shared_ptr<RSocketServerState>,
    ResumeIdentificationToken) {}

folly::Expected<std::shared_ptr<RSocketServerState>, RSocketException>
RSocketServiceHandler::onResume(ResumeIdentificationToken) {
  return folly::makeUnexpected(RSocketException("No ServerState"));
}

bool RSocketServiceHandler::canResume(
    const std::vector<StreamId>& /* cleanStreamIds */,
    const std::vector<StreamId>& /* dirtyStreamIds */,
    ResumeIdentificationToken) const {
  return true;
}

std::shared_ptr<RSocketServiceHandler> RSocketServiceHandler::create(
    OnNewSetupFn onNewSetupFn) {
  class ServiceHandler : public RSocketServiceHandler {
   public:
    explicit ServiceHandler(OnNewSetupFn fn) : onNewSetupFn_(std::move(fn)) {}
    folly::Expected<RSocketConnectionParams, RSocketException> onNewSetup(
        const SetupParameters& setupParameters) override {
      try {
        return RSocketConnectionParams(onNewSetupFn_(setupParameters));
      } catch (const std::exception& e) {
        return folly::Unexpected<RSocketException>(
            ConnectionException(e.what()));
      }
    }

   private:
    OnNewSetupFn onNewSetupFn_;
  };
  return std::make_shared<ServiceHandler>(std::move(onNewSetupFn));
}
} // namespace rsocket
