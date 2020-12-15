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

#include "yarpl/Flowable.h"

#include "rsocket/Payload.h"
#include "rsocket/framing/FrameHeader.h"
#include "rsocket/internal/Common.h"

namespace rsocket {

// This class has to be implemented by the client application for cold
// resumption.  The default implementation will error/close the streams.
class ColdResumeHandler {
 public:
  virtual ~ColdResumeHandler() = default;

  // Generate an application-aware streamToken for the given stream parameters.
  virtual std::string
  generateStreamToken(const Payload&, StreamId streamId, StreamType) const;

  // This method will be called for each REQUEST_STREAM for which the
  // application acted as a responder.  The default action would be to return a
  // Flowable which errors out immediately.
  // The second parameter is the allowance which the application received
  // before cold-start and hasn't been fulfilled yet.
  virtual std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
  handleResponderResumeStream(
      std::string streamToken,
      size_t publisherAllowance);

  // This method will be called for each REQUEST_STREAM for which the
  // application acted as a requester.  The default action would be to return a
  // Subscriber which cancels the stream immediately after getting subscribed.
  // The second parameter is the allowance which the application requested
  // before cold-start and hasn't been fulfilled yet.
  virtual std::shared_ptr<yarpl::flowable::Subscriber<rsocket::Payload>>
  handleRequesterResumeStream(
      std::string streamToken,
      size_t consumerAllowance);
};

} // namespace rsocket
