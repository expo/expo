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

#include "rsocket/ColdResumeHandler.h"

#include "yarpl/flowable/CancelingSubscriber.h"

#include <folly/Conv.h>

using namespace yarpl::flowable;

namespace rsocket {

std::string ColdResumeHandler::generateStreamToken(
    const Payload&,
    StreamId streamId,
    StreamType) const {
  return folly::to<std::string>(streamId);
}

std::shared_ptr<Flowable<Payload>>
ColdResumeHandler::handleResponderResumeStream(
    std::string /* streamToken */,
    size_t /* publisherAllowance */) {
  return Flowable<Payload>::error(
      std::logic_error("ResumeHandler method not implemented"));
}

std::shared_ptr<Subscriber<Payload>>
ColdResumeHandler::handleRequesterResumeStream(
    std::string /* streamToken */,
    size_t /* consumerAllowance */) {
  return std::make_shared<CancelingSubscriber<Payload>>();
}
} // namespace rsocket
