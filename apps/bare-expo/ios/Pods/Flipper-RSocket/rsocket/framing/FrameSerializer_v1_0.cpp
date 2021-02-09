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

#include "rsocket/framing/FrameSerializer_v1_0.h"

#include <folly/io/Cursor.h>

namespace rsocket {

constexpr const ProtocolVersion FrameSerializerV1_0::Version;
constexpr const size_t FrameSerializerV1_0::kFrameHeaderSize;
constexpr const size_t FrameSerializerV1_0::kMinBytesNeededForAutodetection;

namespace {
constexpr const uint32_t kMedatadaLengthSize = 3u; // bytes
constexpr const uint32_t kMaxMetadataLength = 0xFFFFFFu; // 24bit max value
} // namespace

ProtocolVersion FrameSerializerV1_0::protocolVersion() const {
  return Version;
}

static FrameType deserializeFrameType(uint16_t frameType) {
  if (frameType > static_cast<uint8_t>(FrameType::RESUME_OK) &&
      frameType != static_cast<uint8_t>(FrameType::EXT)) {
    return FrameType::RESERVED;
  }
  return static_cast<FrameType>(frameType);
}

static void serializeHeaderInto(
    folly::io::QueueAppender& appender,
    const FrameHeader& header) {
  appender.writeBE<int32_t>(static_cast<int32_t>(header.streamId));

  auto type = static_cast<uint8_t>(header.type); // 6 bit
  auto flags = static_cast<uint16_t>(header.flags); // 10 bit
  appender.write(static_cast<uint8_t>((type << 2) | (flags >> 8)));
  appender.write(static_cast<uint8_t>(flags)); // lower 8 bits
}

static void deserializeHeaderFrom(folly::io::Cursor& cur, FrameHeader& header) {
  auto streamId = cur.readBE<int32_t>();
  if (streamId < 0) {
    throw std::runtime_error("invalid stream id");
  }
  header.streamId = static_cast<StreamId>(streamId);
  uint16_t type = cur.readBE<uint8_t>(); // |Frame Type |I|M|
  header.type = deserializeFrameType(type >> 2);
  header.flags =
      static_cast<FrameFlags>(((type & 0x3) << 8) | cur.readBE<uint8_t>());
}

static void serializeMetadataInto(
    folly::io::QueueAppender& appender,
    std::unique_ptr<folly::IOBuf> metadata) {
  if (metadata == nullptr) {
    return;
  }

  // metadata length field not included in the medatadata length
  uint32_t metadataLength =
      static_cast<uint32_t>(metadata->computeChainDataLength());
  CHECK_LT(metadataLength, kMaxMetadataLength)
      << "Metadata is too big to serialize";

  appender.write(static_cast<uint8_t>(metadataLength >> 16)); // first byte
  appender.write(
      static_cast<uint8_t>((metadataLength >> 8) & 0xFF)); // second byte
  appender.write(static_cast<uint8_t>(metadataLength & 0xFF)); // third byte

  appender.insert(std::move(metadata));
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::deserializeMetadataFrom(
    folly::io::Cursor& cur,
    FrameFlags flags) {
  if (!(flags & FrameFlags::METADATA)) {
    return nullptr;
  }

  uint32_t metadataLength = 0;
  metadataLength |= static_cast<uint32_t>(cur.read<uint8_t>() << 16);
  metadataLength |= static_cast<uint32_t>(cur.read<uint8_t>() << 8);
  metadataLength |= cur.read<uint8_t>();

  CHECK_LE(metadataLength, kMaxMetadataLength)
      << "Read out the 24-bit integer incorrectly somehow";

  std::unique_ptr<folly::IOBuf> metadata;
  cur.clone(metadata, metadataLength);
  return metadata;
}

static std::unique_ptr<folly::IOBuf> deserializeDataFrom(
    folly::io::Cursor& cur) {
  std::unique_ptr<folly::IOBuf> data;
  auto totalLength = cur.totalLength();

  if (totalLength > 0) {
    cur.clone(data, totalLength);
  }
  return data;
}

static Payload deserializePayloadFrom(
    folly::io::Cursor& cur,
    FrameFlags flags) {
  auto metadata = FrameSerializerV1_0::deserializeMetadataFrom(cur, flags);
  auto data = deserializeDataFrom(cur);
  return Payload(std::move(data), std::move(metadata));
}

static void serializePayloadInto(
    folly::io::QueueAppender& appender,
    Payload&& payload) {
  serializeMetadataInto(appender, std::move(payload.metadata));
  if (payload.data) {
    appender.insert(std::move(payload.data));
  }
}

static uint32_t payloadFramingSize(const Payload& payload) {
  return (payload.metadata != nullptr ? kMedatadaLengthSize : 0);
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOutInternal(
    Frame_REQUEST_Base&& frame) const {
  auto queue = createBufferQueue(
      FrameSerializerV1_0::kFrameHeaderSize + sizeof(uint32_t) +
      payloadFramingSize(frame.payload_));

  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);

  appender.writeBE<int32_t>(static_cast<int32_t>(frame.requestN_));
  serializePayloadInto(appender, std::move(frame.payload_));
  return queue.move();
}

static bool deserializeFromInternal(
    Frame_REQUEST_Base& frame,
    std::unique_ptr<folly::IOBuf> in) {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);

    auto requestN = cur.readBE<int32_t>();
    // TODO(lehecka): requestN <= 0
    if (requestN < 0) {
      throw std::runtime_error("invalid request N");
    }
    frame.requestN_ = static_cast<uint32_t>(requestN);
    frame.payload_ = deserializePayloadFrom(cur, frame.header_.flags);
  } catch (...) {
    return false;
  }
  return true;
}

static size_t getResumeIdTokenFramingLength(
    FrameFlags flags,
    const ResumeIdentificationToken& token) {
  return !!(flags & FrameFlags::RESUME_ENABLE)
      ? sizeof(uint16_t) + token.data().size()
      : 0;
}

FrameType FrameSerializerV1_0::peekFrameType(const folly::IOBuf& in) const {
  folly::io::Cursor cur(&in);
  try {
    cur.skip(sizeof(int32_t)); // streamId
    uint8_t type = cur.readBE<uint8_t>(); // |Frame Type |I|M|
    return deserializeFrameType(type >> 2);
  } catch (...) {
    return FrameType::RESERVED;
  }
}

folly::Optional<StreamId> FrameSerializerV1_0::peekStreamId(
    const folly::IOBuf& in,
    bool skipFrameLengthBytes) const {
  folly::io::Cursor cur(&in);
  try {
    if (skipFrameLengthBytes) {
      cur.skip(3); // skip 3 bytes for frame length
    }
    auto streamId = cur.readBE<int32_t>();
    if (streamId < 0) {
      return folly::none;
    }
    return folly::make_optional(static_cast<StreamId>(streamId));
  } catch (...) {
    return folly::none;
  }
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_REQUEST_STREAM&& frame) const {
  return serializeOutInternal(std::move(frame));
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_REQUEST_CHANNEL&& frame) const {
  return serializeOutInternal(std::move(frame));
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_REQUEST_RESPONSE&& frame) const {
  auto queue =
      createBufferQueue(kFrameHeaderSize + payloadFramingSize(frame.payload_));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  serializePayloadInto(appender, std::move(frame.payload_));
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_REQUEST_FNF&& frame) const {
  auto queue =
      createBufferQueue(kFrameHeaderSize + payloadFramingSize(frame.payload_));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  serializePayloadInto(appender, std::move(frame.payload_));
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_REQUEST_N&& frame) const {
  auto queue = createBufferQueue(kFrameHeaderSize + sizeof(uint32_t));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  appender.writeBE<int32_t>(static_cast<int32_t>(frame.requestN_));
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_METADATA_PUSH&& frame) const {
  auto queue = createBufferQueue(kFrameHeaderSize);
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  if (frame.metadata_) {
    appender.insert(std::move(frame.metadata_));
  }
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_CANCEL&& frame) const {
  auto queue = createBufferQueue(kFrameHeaderSize);
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_PAYLOAD&& frame) const {
  auto queue =
      createBufferQueue(kFrameHeaderSize + payloadFramingSize(frame.payload_));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  serializePayloadInto(appender, std::move(frame.payload_));
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_ERROR&& frame) const {
  auto queue = createBufferQueue(
      kFrameHeaderSize + sizeof(uint32_t) + payloadFramingSize(frame.payload_));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  appender.writeBE(static_cast<uint32_t>(frame.errorCode_));
  serializePayloadInto(appender, std::move(frame.payload_));
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_KEEPALIVE&& frame) const {
  auto queue = createBufferQueue(kFrameHeaderSize + sizeof(int64_t));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  appender.writeBE<int64_t>(static_cast<int64_t>(frame.position_));
  if (frame.data_) {
    appender.insert(std::move(frame.data_));
  }
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_SETUP&& frame) const {
  auto queue = createBufferQueue(
      kFrameHeaderSize + sizeof(uint16_t) + sizeof(uint16_t) + sizeof(int32_t) +
      sizeof(int32_t) +
      getResumeIdTokenFramingLength(frame.header_.flags, frame.token_) +
      +sizeof(uint8_t) + frame.metadataMimeType_.length() + sizeof(uint8_t) +
      frame.dataMimeType_.length() + payloadFramingSize(frame.payload_));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);

  serializeHeaderInto(appender, frame.header_);
  CHECK(
      frame.versionMajor_ != ProtocolVersion::Unknown.major ||
      frame.versionMinor_ != ProtocolVersion::Unknown.minor);
  appender.writeBE<uint16_t>(frame.versionMajor_);
  appender.writeBE<uint16_t>(frame.versionMinor_);
  appender.writeBE(static_cast<int32_t>(frame.keepaliveTime_));
  appender.writeBE(static_cast<int32_t>(frame.maxLifetime_));

  if (!!(frame.header_.flags & FrameFlags::RESUME_ENABLE)) {
    appender.writeBE<uint16_t>(
        static_cast<uint16_t>(frame.token_.data().size()));
    appender.push(frame.token_.data().data(), frame.token_.data().size());
  }

  CHECK(
      frame.metadataMimeType_.length() <= std::numeric_limits<uint8_t>::max());
  appender.writeBE(static_cast<uint8_t>(frame.metadataMimeType_.length()));
  appender.push(
      reinterpret_cast<const uint8_t*>(frame.metadataMimeType_.data()),
      frame.metadataMimeType_.length());

  CHECK(frame.dataMimeType_.length() <= std::numeric_limits<uint8_t>::max());
  appender.writeBE(static_cast<uint8_t>(frame.dataMimeType_.length()));
  appender.push(
      reinterpret_cast<const uint8_t*>(frame.dataMimeType_.data()),
      frame.dataMimeType_.length());

  serializePayloadInto(appender, std::move(frame.payload_));
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_LEASE&& frame) const {
  auto queue =
      createBufferQueue(kFrameHeaderSize + sizeof(int32_t) + sizeof(int32_t));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  appender.writeBE(static_cast<int32_t>(frame.ttl_));
  appender.writeBE(static_cast<int32_t>(frame.numberOfRequests_));
  if (frame.metadata_) {
    appender.insert(std::move(frame.metadata_));
  }
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_RESUME&& frame) const {
  auto queue = createBufferQueue(
      kFrameHeaderSize + sizeof(uint16_t) + sizeof(uint16_t) +
      sizeof(uint16_t) + frame.token_.data().size() + sizeof(int32_t) +
      sizeof(int32_t));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);

  CHECK(
      frame.versionMajor_ != ProtocolVersion::Unknown.major ||
      frame.versionMinor_ != ProtocolVersion::Unknown.minor);
  appender.writeBE(static_cast<uint16_t>(frame.versionMajor_));
  appender.writeBE(static_cast<uint16_t>(frame.versionMinor_));

  appender.writeBE<uint16_t>(static_cast<uint16_t>(frame.token_.data().size()));
  appender.push(frame.token_.data().data(), frame.token_.data().size());

  appender.writeBE<int64_t>(frame.lastReceivedServerPosition_);
  appender.writeBE<int64_t>(frame.clientPosition_);
  return queue.move();
}

std::unique_ptr<folly::IOBuf> FrameSerializerV1_0::serializeOut(
    Frame_RESUME_OK&& frame) const {
  auto queue = createBufferQueue(kFrameHeaderSize + sizeof(int64_t));
  folly::io::QueueAppender appender(&queue, /* do not grow */ 0);
  serializeHeaderInto(appender, frame.header_);
  appender.writeBE<int64_t>(frame.position_);
  return queue.move();
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_REQUEST_STREAM& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  return deserializeFromInternal(frame, std::move(in));
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_REQUEST_CHANNEL& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  return deserializeFromInternal(frame, std::move(in));
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_REQUEST_RESPONSE& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);
    frame.payload_ = deserializePayloadFrom(cur, frame.header_.flags);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_REQUEST_FNF& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);
    frame.payload_ = deserializePayloadFrom(cur, frame.header_.flags);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_REQUEST_N& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);
    auto requestN = cur.readBE<int32_t>();
    if (requestN <= 0) {
      throw std::runtime_error("invalid request n");
    }
    frame.requestN_ = static_cast<uint32_t>(requestN);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_METADATA_PUSH& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);
    // metadata takes the rest of the frame, just like data in other frames
    // that's why we use deserializeDataFrom
    frame.metadata_ = deserializeDataFrom(cur);
  } catch (...) {
    return false;
  }
  return frame.metadata_ != nullptr;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_CANCEL& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_PAYLOAD& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);
    frame.payload_ = deserializePayloadFrom(cur, frame.header_.flags);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_ERROR& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);
    frame.errorCode_ = static_cast<ErrorCode>(cur.readBE<uint32_t>());
    frame.payload_ = deserializePayloadFrom(cur, frame.header_.flags);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_KEEPALIVE& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);
    auto position = cur.readBE<int64_t>();
    if (position < 0) {
      throw std::runtime_error("invalid value for position");
    }
    frame.position_ = static_cast<ResumePosition>(position);
    frame.data_ = deserializeDataFrom(cur);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_SETUP& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);

    frame.versionMajor_ = cur.readBE<uint16_t>();
    frame.versionMinor_ = cur.readBE<uint16_t>();

    auto keepaliveTime = cur.readBE<int32_t>();
    if (keepaliveTime <= 0) {
      throw std::runtime_error("invalid keepalive time");
    }
    frame.keepaliveTime_ = static_cast<uint32_t>(keepaliveTime);

    auto maxLifetime = cur.readBE<int32_t>();
    if (maxLifetime <= 0) {
      throw std::runtime_error("invalid maxLife time");
    }
    frame.maxLifetime_ = static_cast<uint32_t>(maxLifetime);

    if (!!(frame.header_.flags & FrameFlags::RESUME_ENABLE)) {
      auto resumeTokenSize = cur.readBE<uint16_t>();
      std::vector<uint8_t> data(resumeTokenSize);
      cur.pull(data.data(), data.size());
      frame.token_.set(std::move(data));
    } else {
      frame.token_ = ResumeIdentificationToken();
    }

    auto mdmtLen = cur.readBE<uint8_t>();
    frame.metadataMimeType_ = cur.readFixedString(mdmtLen);

    auto dmtLen = cur.readBE<uint8_t>();
    frame.dataMimeType_ = cur.readFixedString(dmtLen);
    frame.payload_ = deserializePayloadFrom(cur, frame.header_.flags);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_LEASE& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);

    auto ttl = cur.readBE<int32_t>();
    if (ttl <= 0) {
      throw std::runtime_error("invalid ttl value");
    }
    frame.ttl_ = static_cast<uint32_t>(ttl);

    auto numberOfRequests = cur.readBE<int32_t>();
    if (numberOfRequests <= 0) {
      throw std::runtime_error("invalid numberOfRequests value");
    }
    frame.numberOfRequests_ = static_cast<uint32_t>(numberOfRequests);
    frame.metadata_ = deserializeDataFrom(cur);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_RESUME& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);
    frame.versionMajor_ = cur.readBE<uint16_t>();
    frame.versionMinor_ = cur.readBE<uint16_t>();

    auto resumeTokenSize = cur.readBE<uint16_t>();
    std::vector<uint8_t> data(resumeTokenSize);
    cur.pull(data.data(), data.size());
    frame.token_.set(std::move(data));

    auto lastReceivedServerPosition = cur.readBE<int64_t>();
    if (lastReceivedServerPosition < 0) {
      throw std::runtime_error("invalid value for lastReceivedServerPosition");
    }
    frame.lastReceivedServerPosition_ =
        static_cast<ResumePosition>(lastReceivedServerPosition);

    auto clientPosition = cur.readBE<int64_t>();
    if (clientPosition < 0) {
      throw std::runtime_error("invalid value for clientPosition");
    }
    frame.clientPosition_ = static_cast<ResumePosition>(clientPosition);
  } catch (...) {
    return false;
  }
  return true;
}

bool FrameSerializerV1_0::deserializeFrom(
    Frame_RESUME_OK& frame,
    std::unique_ptr<folly::IOBuf> in) const {
  folly::io::Cursor cur(in.get());
  try {
    deserializeHeaderFrom(cur, frame.header_);

    auto position = cur.readBE<int64_t>();
    if (position < 0) {
      throw std::runtime_error("invalid value for position");
    }
    frame.position_ = static_cast<ResumePosition>(position);
  } catch (...) {
    return false;
  }
  return true;
}

ProtocolVersion FrameSerializerV1_0::detectProtocolVersion(
    const folly::IOBuf& firstFrame,
    size_t skipBytes) {
  // SETUP frame
  //  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  //  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  //  |                         Stream ID = 0                         |
  //  +-----------+-+-+-+-+-----------+-------------------------------+
  //  |Frame Type |0|M|R|L|  Flags    |
  //  +-----------+-+-+-+-+-----------+-------------------------------+
  //  |         Major Version         |        Minor Version          |
  //  +-------------------------------+-------------------------------+
  //                                 ...
  //  +-------------------------------+-------------------------------+

  // RESUME frame
  //  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  //  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  //  |                         Stream ID = 0                         |
  //  +-----------+-+-+---------------+-------------------------------+
  //  |Frame Type |0|0|    Flags      |
  //  +-------------------------------+-------------------------------+
  //  |        Major Version          |         Minor Version         |
  //  +-------------------------------+-------------------------------+
  //                                 ...
  //  +-------------------------------+-------------------------------+

  folly::io::Cursor cur(&firstFrame);
  try {
    cur.skip(skipBytes);

    auto streamId = cur.readBE<int32_t>();
    auto frameType = cur.readBE<uint8_t>() >> 2;
    cur.skip(sizeof(uint8_t)); // flags
    auto majorVersion = cur.readBE<uint16_t>();
    auto minorVersion = cur.readBE<uint16_t>();

    constexpr static const auto kSETUP = 0x01;
    constexpr static const auto kRESUME = 0x0D;

    VLOG(4) << "frameType=" << frameType << "streamId=" << streamId
            << " majorVersion=" << majorVersion
            << " minorVersion=" << minorVersion;

    if (streamId == 0 && (frameType == kSETUP || frameType == kRESUME) &&
        majorVersion == FrameSerializerV1_0::Version.major &&
        minorVersion == FrameSerializerV1_0::Version.minor) {
      return FrameSerializerV1_0::Version;
    }
  } catch (...) {
  }
  return ProtocolVersion::Unknown;
}

size_t FrameSerializerV1_0::frameLengthFieldSize() const {
  return 3; // bytes
}
} // namespace rsocket
