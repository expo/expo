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
#include "rsocket/framing/ProtocolVersion.h"
#include "rsocket/internal/Common.h"

namespace rsocket {

///
/// Frames class is used to parse individual rsocket frames from the stream of
/// incoming payload chunks. Every time a frame is parsed the onFrame method is
/// invoked.
/// Each rsocket frame is prepended with the frame length by
/// prependSize method.
///
class Framer {
 public:
  Framer(ProtocolVersion protocolVersion, bool stripFrameLengthField)
      : protocolVersion_{protocolVersion},
        stripFrameLengthField_{stripFrameLengthField} {}
  virtual ~Framer() {}

  /// For processing incoming frame chunks
  void addFrameChunk(std::unique_ptr<folly::IOBuf>);

  /// Prepends payload size to the beginning of he IOBuf based on the
  /// set protocol version
  std::unique_ptr<folly::IOBuf> prependSize(
      std::unique_ptr<folly::IOBuf> payload);

  /// derived class can override this method to react to termination
  virtual void error(const char*) = 0;
  virtual void onFrame(std::unique_ptr<folly::IOBuf>) = 0;

  ProtocolVersion protocolVersion() const {
    return protocolVersion_;
  }

  StreamId peekStreamId(const folly::IOBuf& frame, bool) const;

  std::unique_ptr<folly::IOBuf> drainPayloadQueue();

 private:
  // to explicitly trigger parsing frames
  void parseFrames();
  bool ensureOrAutodetectProtocolVersion();

  size_t readFrameLength() const;
  size_t frameSizeFieldLength() const;
  size_t minimalFrameLength() const;
  size_t frameSizeWithLengthField(size_t frameSize) const;
  size_t frameSizeWithoutLengthField(size_t frameSize) const;

  folly::IOBufQueue payloadQueue_{folly::IOBufQueue::cacheChainLength()};
  ProtocolVersion protocolVersion_;
  const bool stripFrameLengthField_;
};

} // namespace rsocket
