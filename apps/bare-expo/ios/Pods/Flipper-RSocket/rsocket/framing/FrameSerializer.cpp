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

#include "rsocket/framing/FrameSerializer.h"
#include "rsocket/framing/FrameSerializer_v1_0.h"

namespace rsocket {

std::unique_ptr<FrameSerializer> FrameSerializer::createFrameSerializer(
    const ProtocolVersion& protocolVersion) {
  if (protocolVersion == FrameSerializerV1_0::Version) {
    return std::make_unique<FrameSerializerV1_0>();
  }

  DCHECK(protocolVersion == ProtocolVersion::Unknown);
  LOG_IF(ERROR, protocolVersion != ProtocolVersion::Unknown)
      << "unknown protocol version " << protocolVersion;
  return nullptr;
}

std::unique_ptr<FrameSerializer> FrameSerializer::createAutodetectedSerializer(
    const folly::IOBuf& firstFrame) {
  auto detectedVersion = FrameSerializerV1_0::detectProtocolVersion(firstFrame);
  return createFrameSerializer(detectedVersion);
}

bool& FrameSerializer::preallocateFrameSizeField() {
  return preallocateFrameSizeField_;
}

folly::IOBufQueue FrameSerializer::createBufferQueue(size_t bufferSize) const {
  const auto prependSize =
      preallocateFrameSizeField_ ? frameLengthFieldSize() : 0;
  auto buf = folly::IOBuf::createCombined(bufferSize + prependSize);
  buf->advance(prependSize);
  folly::IOBufQueue queue(folly::IOBufQueue::cacheChainLength());
  queue.append(std::move(buf));
  return queue;
}

folly::Optional<StreamId> FrameSerializer::peekStreamId(
    const ProtocolVersion& protocolVersion,
    const folly::IOBuf& frame,
    bool skipFrameLengthBytes) {
  if (protocolVersion == FrameSerializerV1_0::Version) {
    return FrameSerializerV1_0().peekStreamId(frame, skipFrameLengthBytes);
  }

  auto* msg = "unknown protocol version";
  DCHECK(false) << msg;
  return folly::none;
}

} // namespace rsocket
