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

namespace rsocket {
class RSocketTransportHandler {
 public:
  virtual ~RSocketTransportHandler() = default;

  // connection scope signals
  virtual void onKeepAlive(
      ResumePosition resumePosition,
      std::unique_ptr<folly::IOBuf> data,
      bool keepAliveRespond) = 0;
  virtual void onMetadataPush(std::unique_ptr<folly::IOBuf> metadata) = 0;
  virtual void onResumeOk(ResumePosition resumePosition);
  virtual void onError(ErrorCode errorCode, Payload payload) = 0;

  // stream scope signals
  virtual void onStreamRequestN(StreamId streamId, uint32_t requestN) = 0;
  virtual void onStreamCancel(StreamId streamId) = 0;
  virtual void onStreamError(StreamId streamId, Payload payload) = 0;
  virtual void onStreamPayload(
      StreamId streamId,
      Payload payload,
      bool flagsFollows,
      bool flagsComplete,
      bool flagsNext) = 0;
};

class RSocketTransport {
 public:
  virtual ~RSocketTransport() = default;

  // TODO:
};
} // namespace rsocket
