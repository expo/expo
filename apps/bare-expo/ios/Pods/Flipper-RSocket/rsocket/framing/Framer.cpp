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

#include "rsocket/framing/Framer.h"
#include <folly/io/Cursor.h>
#include "rsocket/framing/FrameSerializer_v1_0.h"

namespace rsocket {

namespace {

constexpr size_t kFrameLengthFieldLengthV1_0 = 3;
constexpr auto kMaxFrameLength = 0xFFFFFF; // 24bit max value

template <typename TWriter>
void writeFrameLength(
    TWriter& cur,
    size_t frameLength,
    size_t frameSizeFieldLength) {
  DCHECK(frameSizeFieldLength > 0);

  // starting from the highest byte
  // frameSizeFieldLength == 3 => shift = [16,8,0]
  // frameSizeFieldLength == 4 => shift = [24,16,8,0]
  auto shift = (frameSizeFieldLength - 1) * 8;

  while (frameSizeFieldLength--) {
    const auto byte = (frameLength >> shift) & 0xFF;
    cur.write(static_cast<uint8_t>(byte));
    shift -= 8;
  }
}
} // namespace

/// Get the byte size of the frame length field in an RSocket frame.
size_t Framer::frameSizeFieldLength() const {
  DCHECK_NE(protocolVersion_, ProtocolVersion::Unknown);
  if (protocolVersion_ < FrameSerializerV1_0::Version) {
    return sizeof(int32_t);
  } else {
    return 3; // bytes
  }
}

/// Get the minimum size for a valid RSocket frame (including its frame length
/// field).
size_t Framer::minimalFrameLength() const {
  DCHECK_NE(protocolVersion_, ProtocolVersion::Unknown);
  return FrameSerializerV1_0::kFrameHeaderSize;
}

/// Compute the length of the entire frame (including its frame length field),
/// if given only its frame length field.
size_t Framer::frameSizeWithLengthField(size_t frameSize) const {
  return protocolVersion_ < FrameSerializerV1_0::Version
      ? frameSize
      : frameSize + frameSizeFieldLength();
}

/// Compute the length of the frame (excluding its frame length field), if given
/// only its frame length field.
size_t Framer::frameSizeWithoutLengthField(size_t frameSize) const {
  DCHECK_NE(protocolVersion_, ProtocolVersion::Unknown);
  return protocolVersion_ < FrameSerializerV1_0::Version
      ? frameSize - frameSizeFieldLength()
      : frameSize;
}

size_t Framer::readFrameLength() const {
  const auto fieldLength = frameSizeFieldLength();
  DCHECK_GT(fieldLength, 0);

  folly::io::Cursor cur{payloadQueue_.front()};
  size_t frameLength = 0;

  // Reading of arbitrary-sized big-endian integer.
  for (size_t i = 0; i < fieldLength; ++i) {
    frameLength <<= 8;
    frameLength |= cur.read<uint8_t>();
  }

  return frameLength;
}

void Framer::addFrameChunk(std::unique_ptr<folly::IOBuf> payload) {
  payloadQueue_.append(std::move(payload));
  parseFrames();
}

void Framer::parseFrames() {
  if (payloadQueue_.empty() || !ensureOrAutodetectProtocolVersion()) {
    // At this point we dont have enough bytes on the wire or we errored out.
    return;
  }

  while (!payloadQueue_.empty()) {
    auto const frameSizeFieldLen = frameSizeFieldLength();
    if (payloadQueue_.chainLength() < frameSizeFieldLen) {
      // We don't even have the next frame size value.
      break;
    }

    auto const nextFrameSize = readFrameLength();
    if (nextFrameSize < minimalFrameLength()) {
      error("Invalid frame - Frame size smaller than minimum");
      break;
    }

    if (payloadQueue_.chainLength() < frameSizeWithLengthField(nextFrameSize)) {
      // Need to accumulate more data.
      break;
    }

    auto payloadSize = frameSizeWithoutLengthField(nextFrameSize);
    if (stripFrameLengthField_) {
      payloadQueue_.trimStart(frameSizeFieldLen);
    } else {
      payloadSize += frameSizeFieldLen;
    }

    DCHECK_GT(payloadSize, 0)
        << "folly::IOBufQueue::split(0) returns a nullptr, can't have that";
    auto nextFrame = payloadQueue_.split(payloadSize);
    onFrame(std::move(nextFrame));
  }
}

bool Framer::ensureOrAutodetectProtocolVersion() {
  if (protocolVersion_ != ProtocolVersion::Unknown) {
    return true;
  }

  const auto minBytesNeeded =
      FrameSerializerV1_0::kMinBytesNeededForAutodetection;
  DCHECK_GT(minBytesNeeded, 0);
  if (payloadQueue_.chainLength() < minBytesNeeded) {
    return false;
  }

  DCHECK_GT(minBytesNeeded, kFrameLengthFieldLengthV1_0);

  auto const& firstFrame = *payloadQueue_.front();

  const auto detectedV1 = FrameSerializerV1_0::detectProtocolVersion(
      firstFrame, kFrameLengthFieldLengthV1_0);
  if (detectedV1 != ProtocolVersion::Unknown) {
    protocolVersion_ = FrameSerializerV1_0::Version;
    return true;
  }

  error("Could not detect protocol version from data");
  return false;
}

std::unique_ptr<folly::IOBuf> Framer::prependSize(
    std::unique_ptr<folly::IOBuf> payload) {
  CHECK(payload);

  const auto frameSizeFieldLengthValue = frameSizeFieldLength();
  const auto payloadLength = payload->computeChainDataLength();

  CHECK_LE(payloadLength, kMaxFrameLength)
      << "payloadLength: " << payloadLength
      << " kMaxFrameLength: " << kMaxFrameLength;

  if (payload->headroom() >= frameSizeFieldLengthValue) {
    // move the data pointer back and write value to the payload
    payload->prepend(frameSizeFieldLengthValue);
    folly::io::RWPrivateCursor cur(payload.get());
    writeFrameLength(cur, payloadLength, frameSizeFieldLengthValue);
    return payload;
  } else {
    auto newPayload = folly::IOBuf::createCombined(frameSizeFieldLengthValue);
    folly::io::Appender appender(newPayload.get(), /* do not grow */ 0);
    writeFrameLength(appender, payloadLength, frameSizeFieldLengthValue);
    newPayload->appendChain(std::move(payload));
    return newPayload;
  }
}

StreamId Framer::peekStreamId(
    const folly::IOBuf& frame,
    bool skipFrameLengthBytes) const {
  return FrameSerializer::peekStreamId(
             protocolVersion_, frame, skipFrameLengthBytes)
      .value();
}

std::unique_ptr<folly::IOBuf> Framer::drainPayloadQueue() {
  return payloadQueue_.move();
}

} // namespace rsocket
