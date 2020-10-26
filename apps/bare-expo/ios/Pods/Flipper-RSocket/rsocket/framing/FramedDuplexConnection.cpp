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

#include "rsocket/framing/FramedDuplexConnection.h"
#include <folly/io/Cursor.h>
#include "rsocket/framing/FrameSerializer_v1_0.h"
#include "rsocket/framing/FramedReader.h"

namespace rsocket {

namespace {

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

size_t getFrameSizeFieldLength(ProtocolVersion version) {
  CHECK(version != ProtocolVersion::Unknown);
  if (version < FrameSerializerV1_0::Version) {
    return sizeof(int32_t);
  } else {
    return 3; // bytes
  }
}

std::unique_ptr<folly::IOBuf> prependSize(
    ProtocolVersion version,
    std::unique_ptr<folly::IOBuf> payload) {
  CHECK(payload);

  const auto frameSizeFieldLength = getFrameSizeFieldLength(version);
  const auto payloadLength = payload->computeChainDataLength();

  CHECK_LE(payloadLength, kMaxFrameLength)
      << "payloadLength: " << payloadLength
      << " kMaxFrameLength: " << kMaxFrameLength;

  if (payload->headroom() >= frameSizeFieldLength) {
    // move the data pointer back and write value to the payload
    payload->prepend(frameSizeFieldLength);
    folly::io::RWPrivateCursor cur(payload.get());
    writeFrameLength(cur, payloadLength, frameSizeFieldLength);
    VLOG(4) << "writing frame length=" << payload->length() << std::endl
            << hexDump(payload->clone()->moveToFbString());
    return payload;
  } else {
    auto newPayload = folly::IOBuf::createCombined(frameSizeFieldLength);
    folly::io::Appender appender(newPayload.get(), /* do not grow */ 0);
    writeFrameLength(appender, payloadLength, frameSizeFieldLength);
    newPayload->appendChain(std::move(payload));
    VLOG(4) << "writing frame length=" << newPayload->computeChainDataLength()
            << std::endl
            << hexDump(newPayload->clone()->moveToFbString());
    return newPayload;
  }
}

} // namespace

FramedDuplexConnection::~FramedDuplexConnection() {}

FramedDuplexConnection::FramedDuplexConnection(
    std::unique_ptr<DuplexConnection> connection,
    ProtocolVersion protocolVersion)
    : inner_(std::move(connection)),
      protocolVersion_(std::make_shared<ProtocolVersion>(protocolVersion)) {}

void FramedDuplexConnection::send(std::unique_ptr<folly::IOBuf> buf) {
  if (!inner_) {
    return;
  }

  auto sized = prependSize(*protocolVersion_, std::move(buf));
  inner_->send(std::move(sized));
}

void FramedDuplexConnection::setInput(
    std::shared_ptr<DuplexConnection::Subscriber> framesSink) {
  if (!inputReader_) {
    inputReader_ = std::make_shared<FramedReader>(protocolVersion_);
    inner_->setInput(inputReader_);
  }
  inputReader_->setInput(std::move(framesSink));
}
} // namespace rsocket
