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

#include "rsocket/framing/FrameSerializer.h"

namespace rsocket {

class FrameSerializerV1_0 : public FrameSerializer {
 public:
  constexpr static const ProtocolVersion Version = ProtocolVersion(1, 0);
  constexpr static const size_t kFrameHeaderSize = 6; // bytes
  constexpr static const size_t kMinBytesNeededForAutodetection = 10; // bytes

  ProtocolVersion protocolVersion() const override;

  static ProtocolVersion detectProtocolVersion(
      const folly::IOBuf& firstFrame,
      size_t skipBytes = 0);

  FrameType peekFrameType(const folly::IOBuf& in) const override;
  folly::Optional<StreamId> peekStreamId(
      const folly::IOBuf& in,
      bool skipFrameLengthBytes) const override;

  std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_REQUEST_STREAM&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_REQUEST_CHANNEL&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_REQUEST_RESPONSE&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_REQUEST_FNF&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(Frame_REQUEST_N&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_METADATA_PUSH&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(Frame_CANCEL&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(Frame_PAYLOAD&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(Frame_ERROR&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(Frame_KEEPALIVE&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(Frame_SETUP&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(Frame_LEASE&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(Frame_RESUME&&) const override;
  std::unique_ptr<folly::IOBuf> serializeOut(Frame_RESUME_OK&&) const override;

  bool deserializeFrom(Frame_REQUEST_STREAM&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_REQUEST_CHANNEL&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_REQUEST_RESPONSE&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_REQUEST_FNF&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_REQUEST_N&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_METADATA_PUSH&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_CANCEL&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_PAYLOAD&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_ERROR&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_KEEPALIVE&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_SETUP&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_LEASE&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_RESUME&, std::unique_ptr<folly::IOBuf>)
      const override;
  bool deserializeFrom(Frame_RESUME_OK&, std::unique_ptr<folly::IOBuf>)
      const override;

  static std::unique_ptr<folly::IOBuf> deserializeMetadataFrom(
      folly::io::Cursor& cur,
      FrameFlags flags);

 private:
  std::unique_ptr<folly::IOBuf> serializeOutInternal(
      Frame_REQUEST_Base&& frame) const;

  size_t frameLengthFieldSize() const override;
};
} // namespace rsocket
