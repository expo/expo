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

#include <array>
#include <iosfwd>
#include <limits>

#include <folly/io/IOBuf.h>
#include <folly/io/IOBufQueue.h>

#include "rsocket/Payload.h"
#include "rsocket/framing/ErrorCode.h"
#include "rsocket/framing/FrameFlags.h"
#include "rsocket/framing/FrameHeader.h"
#include "rsocket/framing/FrameType.h"
#include "rsocket/framing/ProtocolVersion.h"
#include "rsocket/framing/ResumeIdentificationToken.h"

namespace folly {
template <typename V>
class Optional;
namespace io {
class Cursor;
class QueueAppender;
} // namespace io
} // namespace folly

namespace rsocket {

namespace detail {

FrameFlags getFlags(const Payload&);

void checkFlags(const Payload&, FrameFlags);

} // namespace detail

using ResumePosition = int64_t;
constexpr ResumePosition kUnspecifiedResumePosition = -1;

/// Frames do not form hierarchy, as we never perform type erasure on a frame.
/// We use inheritance only to save code duplication.
///
/// Since frames are only meaningful for stream automata on both ends of a
/// stream, intermediate layers that are frame-type-agnostic pass around
/// serialized frame.

class Frame_REQUEST_N {
 public:
  /*
   * Maximum value for ReactiveSocket Subscription::request.
   * Value is a signed int, however negative values are not allowed.
   *
   * n.b. this is less than size_t because of the Frame encoding restrictions.
   */
  static constexpr int64_t kMaxRequestN = std::numeric_limits<int32_t>::max();

  Frame_REQUEST_N() = default;
  Frame_REQUEST_N(StreamId streamId, uint32_t requestN)
      : header_(FrameType::REQUEST_N, FrameFlags::EMPTY_, streamId),
        requestN_(requestN) {
    DCHECK(requestN_ > 0);
    DCHECK(requestN_ <= kMaxRequestN);
  }

  FrameHeader header_;
  uint32_t requestN_{};
};
std::ostream& operator<<(std::ostream&, const Frame_REQUEST_N&);

class Frame_REQUEST_Base {
 public:
  Frame_REQUEST_Base() = default;
  Frame_REQUEST_Base(
      FrameType frameType,
      StreamId streamId,
      FrameFlags flags,
      uint32_t requestN,
      Payload payload)
      : header_(frameType, flags | detail::getFlags(payload), streamId),
        requestN_(requestN),
        payload_(std::move(payload)) {
    detail::checkFlags(payload_, header_.flags);
    // TODO: DCHECK(requestN_ > 0);
    DCHECK(requestN_ <= Frame_REQUEST_N::kMaxRequestN);
  }

  /// For compatibility with other data-carrying frames.
  Frame_REQUEST_Base(
      FrameType frameType,
      StreamId streamId,
      FrameFlags flags,
      Payload payload)
      : Frame_REQUEST_Base(frameType, streamId, flags, 0, std::move(payload)) {}

  FrameHeader header_;
  uint32_t requestN_{};
  Payload payload_;
};
std::ostream& operator<<(std::ostream&, const Frame_REQUEST_Base&);

class Frame_REQUEST_STREAM : public Frame_REQUEST_Base {
 public:
  constexpr static const FrameFlags AllowedFlags =
      FrameFlags::METADATA | FrameFlags::FOLLOWS;

  Frame_REQUEST_STREAM() = default;
  Frame_REQUEST_STREAM(
      StreamId streamId,
      FrameFlags flags,
      uint32_t requestN,
      Payload payload)
      : Frame_REQUEST_Base(
            FrameType::REQUEST_STREAM,
            streamId,
            flags,
            requestN,
            std::move(payload)) {}

  /// For compatibility with other data-carrying frames.
  Frame_REQUEST_STREAM(StreamId streamId, FrameFlags flags, Payload payload)
      : Frame_REQUEST_STREAM(
            streamId,
            flags & AllowedFlags,
            0,
            std::move(payload)) {}
};
std::ostream& operator<<(std::ostream& os, const Frame_REQUEST_STREAM& frame);

class Frame_REQUEST_CHANNEL : public Frame_REQUEST_Base {
 public:
  constexpr static const FrameFlags AllowedFlags =
      FrameFlags::METADATA | FrameFlags::FOLLOWS | FrameFlags::COMPLETE;

  Frame_REQUEST_CHANNEL() = default;
  Frame_REQUEST_CHANNEL(
      StreamId streamId,
      FrameFlags flags,
      uint32_t requestN,
      Payload payload)
      : Frame_REQUEST_Base(
            FrameType::REQUEST_CHANNEL,
            streamId,
            flags,
            requestN,
            std::move(payload)) {}

  /// For compatibility with other data-carrying frames.
  Frame_REQUEST_CHANNEL(StreamId streamId, FrameFlags flags, Payload payload)
      : Frame_REQUEST_CHANNEL(
            streamId,
            flags & AllowedFlags,
            0,
            std::move(payload)) {}
};
std::ostream& operator<<(std::ostream&, const Frame_REQUEST_CHANNEL&);

class Frame_REQUEST_RESPONSE {
 public:
  constexpr static const FrameFlags AllowedFlags =
      FrameFlags::METADATA | FrameFlags::FOLLOWS;

  Frame_REQUEST_RESPONSE() = default;
  Frame_REQUEST_RESPONSE(StreamId streamId, FrameFlags flags, Payload payload)
      : header_(
            FrameType::REQUEST_RESPONSE,
            (flags & AllowedFlags) | detail::getFlags(payload),
            streamId),
        payload_(std::move(payload)) {
    detail::checkFlags(payload_, header_.flags);
  }

  FrameHeader header_;
  Payload payload_;
};
std::ostream& operator<<(std::ostream&, const Frame_REQUEST_RESPONSE&);

class Frame_REQUEST_FNF {
 public:
  constexpr static const FrameFlags AllowedFlags =
      FrameFlags::METADATA | FrameFlags::FOLLOWS;

  Frame_REQUEST_FNF() = default;
  Frame_REQUEST_FNF(StreamId streamId, FrameFlags flags, Payload payload)
      : header_(
            FrameType::REQUEST_FNF,
            (flags & AllowedFlags) | detail::getFlags(payload),
            streamId),
        payload_(std::move(payload)) {
    detail::checkFlags(payload_, header_.flags);
  }

  FrameHeader header_;
  Payload payload_;
};
std::ostream& operator<<(std::ostream&, const Frame_REQUEST_FNF&);

class Frame_METADATA_PUSH {
 public:
  Frame_METADATA_PUSH() {}
  explicit Frame_METADATA_PUSH(std::unique_ptr<folly::IOBuf> metadata)
      : header_(FrameType::METADATA_PUSH, FrameFlags::METADATA, 0),
        metadata_(std::move(metadata)) {
    CHECK(metadata_);
  }

  FrameHeader header_;
  std::unique_ptr<folly::IOBuf> metadata_;
};
std::ostream& operator<<(std::ostream&, const Frame_METADATA_PUSH&);

class Frame_CANCEL {
 public:
  Frame_CANCEL() = default;
  explicit Frame_CANCEL(StreamId streamId)
      : header_(FrameType::CANCEL, FrameFlags::EMPTY_, streamId) {}

  FrameHeader header_;
};
std::ostream& operator<<(std::ostream&, const Frame_CANCEL&);

class Frame_PAYLOAD {
 public:
  constexpr static const FrameFlags AllowedFlags = FrameFlags::METADATA |
      FrameFlags::FOLLOWS | FrameFlags::COMPLETE | FrameFlags::NEXT;

  Frame_PAYLOAD() = default;
  Frame_PAYLOAD(StreamId streamId, FrameFlags flags, Payload payload)
      : header_(
            FrameType::PAYLOAD,
            (flags & AllowedFlags) | detail::getFlags(payload),
            streamId),
        payload_(std::move(payload)) {
    detail::checkFlags(payload_, header_.flags);
  }

  static Frame_PAYLOAD complete(StreamId streamId);

  FrameHeader header_;
  Payload payload_;
};
std::ostream& operator<<(std::ostream&, const Frame_PAYLOAD&);

class Frame_ERROR {
 public:
  constexpr static const FrameFlags AllowedFlags = FrameFlags::METADATA;

  Frame_ERROR() = default;
  Frame_ERROR(StreamId streamId, ErrorCode errorCode, Payload payload)
      : header_(FrameType::ERROR, detail::getFlags(payload), streamId),
        errorCode_(errorCode),
        payload_(std::move(payload)) {}

  // Connection errors.
  static Frame_ERROR invalidSetup(folly::StringPiece);
  static Frame_ERROR unsupportedSetup(folly::StringPiece);
  static Frame_ERROR rejectedSetup(folly::StringPiece);
  static Frame_ERROR rejectedResume(folly::StringPiece);
  static Frame_ERROR connectionError(folly::StringPiece);

  // Stream errors.
  static Frame_ERROR applicationError(StreamId, folly::StringPiece);
  static Frame_ERROR applicationError(StreamId, Payload&&);
  static Frame_ERROR rejected(StreamId, folly::StringPiece);
  static Frame_ERROR canceled(StreamId, folly::StringPiece);
  static Frame_ERROR invalid(StreamId, folly::StringPiece);

 private:
  static Frame_ERROR connectionErr(ErrorCode, folly::StringPiece);
  static Frame_ERROR streamErr(ErrorCode, folly::StringPiece, StreamId);

 public:
  FrameHeader header_;
  ErrorCode errorCode_{};
  Payload payload_;
};
std::ostream& operator<<(std::ostream&, const Frame_ERROR&);

class Frame_KEEPALIVE {
 public:
  constexpr static const FrameFlags AllowedFlags =
      FrameFlags::KEEPALIVE_RESPOND;

  Frame_KEEPALIVE() = default;
  Frame_KEEPALIVE(
      FrameFlags flags,
      ResumePosition position,
      std::unique_ptr<folly::IOBuf> data)
      : header_(FrameType::KEEPALIVE, flags & AllowedFlags, 0),
        position_(position),
        data_(std::move(data)) {}

  FrameHeader header_;
  ResumePosition position_{};
  std::unique_ptr<folly::IOBuf> data_;
};
std::ostream& operator<<(std::ostream&, const Frame_KEEPALIVE&);

class SetupParameters;

class Frame_SETUP {
 public:
  constexpr static const FrameFlags AllowedFlags =
      FrameFlags::METADATA | FrameFlags::RESUME_ENABLE | FrameFlags::LEASE;

  constexpr static const uint32_t kMaxKeepaliveTime =
      std::numeric_limits<int32_t>::max();
  constexpr static const uint32_t kMaxLifetime =
      std::numeric_limits<int32_t>::max();

  Frame_SETUP() = default;
  Frame_SETUP(
      FrameFlags flags,
      uint16_t versionMajor,
      uint16_t versionMinor,
      uint32_t keepaliveTime,
      uint32_t maxLifetime,
      const ResumeIdentificationToken& token,
      std::string metadataMimeType,
      std::string dataMimeType,
      Payload payload)
      : header_(
            FrameType::SETUP,
            (flags & AllowedFlags) | detail::getFlags(payload),
            0),
        versionMajor_(versionMajor),
        versionMinor_(versionMinor),
        keepaliveTime_(keepaliveTime),
        maxLifetime_(maxLifetime),
        token_(token),
        metadataMimeType_(metadataMimeType),
        dataMimeType_(dataMimeType),
        payload_(std::move(payload)) {
    detail::checkFlags(payload_, header_.flags);
    DCHECK(keepaliveTime_ > 0);
    DCHECK(maxLifetime_ > 0);
    DCHECK(keepaliveTime_ <= kMaxKeepaliveTime);
    DCHECK(maxLifetime_ <= kMaxLifetime);
  }

  void moveToSetupPayload(SetupParameters& setupPayload);

  FrameHeader header_;
  uint16_t versionMajor_{};
  uint16_t versionMinor_{};
  uint32_t keepaliveTime_{};
  uint32_t maxLifetime_{};
  ResumeIdentificationToken token_;
  std::string metadataMimeType_;
  std::string dataMimeType_;
  Payload payload_;
};
std::ostream& operator<<(std::ostream&, const Frame_SETUP&);
/// @}

class Frame_LEASE {
 public:
  constexpr static const FrameFlags AllowedFlags = FrameFlags::METADATA;
  constexpr static const uint32_t kMaxTtl = std::numeric_limits<int32_t>::max();
  constexpr static const uint32_t kMaxNumRequests =
      std::numeric_limits<int32_t>::max();

  Frame_LEASE() = default;
  Frame_LEASE(
      uint32_t ttl,
      uint32_t numberOfRequests,
      std::unique_ptr<folly::IOBuf> metadata = std::unique_ptr<folly::IOBuf>())
      : header_(
            FrameType::LEASE,
            metadata ? FrameFlags::METADATA : FrameFlags::EMPTY_,
            0),
        ttl_(ttl),
        numberOfRequests_(numberOfRequests),
        metadata_(std::move(metadata)) {
    DCHECK(ttl_ > 0);
    DCHECK(numberOfRequests_ > 0);
    DCHECK(ttl_ <= kMaxTtl);
    DCHECK(numberOfRequests_ <= kMaxNumRequests);
  }

  FrameHeader header_;
  uint32_t ttl_{};
  uint32_t numberOfRequests_{};
  std::unique_ptr<folly::IOBuf> metadata_;
};
std::ostream& operator<<(std::ostream&, const Frame_LEASE&);
/// @}

class Frame_RESUME {
 public:
  Frame_RESUME() = default;
  Frame_RESUME(
      const ResumeIdentificationToken& token,
      ResumePosition lastReceivedServerPosition,
      ResumePosition clientPosition,
      ProtocolVersion protocolVersion)
      : header_(FrameType::RESUME, FrameFlags::EMPTY_, 0),
        versionMajor_(protocolVersion.major),
        versionMinor_(protocolVersion.minor),
        token_(token),
        lastReceivedServerPosition_(lastReceivedServerPosition),
        clientPosition_(clientPosition) {}

  FrameHeader header_;
  uint16_t versionMajor_{};
  uint16_t versionMinor_{};
  ResumeIdentificationToken token_;
  ResumePosition lastReceivedServerPosition_{};
  ResumePosition clientPosition_{};
};
std::ostream& operator<<(std::ostream&, const Frame_RESUME&);
/// @}

class Frame_RESUME_OK {
 public:
  Frame_RESUME_OK() = default;
  explicit Frame_RESUME_OK(ResumePosition position)
      : header_(FrameType::RESUME_OK, FrameFlags::EMPTY_, 0),
        position_(position) {}

  FrameHeader header_;
  ResumePosition position_{};
};
std::ostream& operator<<(std::ostream&, const Frame_RESUME_OK&);

} // namespace rsocket
