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

#include <folly/Optional.h>

#include <memory>

#include "rsocket/framing/Frame.h"

namespace rsocket {

// interface separating serialization/deserialization of ReactiveSocket frames
class FrameSerializer {
 public:
  virtual ~FrameSerializer() = default;

  virtual ProtocolVersion protocolVersion() const = 0;

  static std::unique_ptr<FrameSerializer> createFrameSerializer(
      const ProtocolVersion& protocolVersion);

  static std::unique_ptr<FrameSerializer> createAutodetectedSerializer(
      const folly::IOBuf& firstFrame);

  static folly::Optional<StreamId> peekStreamId(
      const ProtocolVersion& protocolVersion,
      const folly::IOBuf& frame,
      bool skipFrameLengthBytes);

  virtual FrameType peekFrameType(const folly::IOBuf& in) const = 0;
  virtual folly::Optional<StreamId> peekStreamId(
      const folly::IOBuf& in,
      bool skipFrameLengthBytes) const = 0;

  virtual std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_REQUEST_STREAM&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_REQUEST_CHANNEL&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_REQUEST_RESPONSE&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_REQUEST_FNF&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_REQUEST_N&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_METADATA_PUSH&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(Frame_CANCEL&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(Frame_PAYLOAD&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(Frame_ERROR&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_KEEPALIVE&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(Frame_SETUP&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(Frame_LEASE&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(Frame_RESUME&&) const = 0;
  virtual std::unique_ptr<folly::IOBuf> serializeOut(
      Frame_RESUME_OK&&) const = 0;

  virtual bool deserializeFrom(
      Frame_REQUEST_STREAM&,
      std::unique_ptr<folly::IOBuf>) const = 0;
  virtual bool deserializeFrom(
      Frame_REQUEST_CHANNEL&,
      std::unique_ptr<folly::IOBuf>) const = 0;
  virtual bool deserializeFrom(
      Frame_REQUEST_RESPONSE&,
      std::unique_ptr<folly::IOBuf>) const = 0;
  virtual bool deserializeFrom(
      Frame_REQUEST_FNF&,
      std::unique_ptr<folly::IOBuf>) const = 0;
  virtual bool deserializeFrom(Frame_REQUEST_N&, std::unique_ptr<folly::IOBuf>)
      const = 0;
  virtual bool deserializeFrom(
      Frame_METADATA_PUSH&,
      std::unique_ptr<folly::IOBuf>) const = 0;
  virtual bool deserializeFrom(Frame_CANCEL&, std::unique_ptr<folly::IOBuf>)
      const = 0;
  virtual bool deserializeFrom(Frame_PAYLOAD&, std::unique_ptr<folly::IOBuf>)
      const = 0;
  virtual bool deserializeFrom(Frame_ERROR&, std::unique_ptr<folly::IOBuf>)
      const = 0;
  virtual bool deserializeFrom(Frame_KEEPALIVE&, std::unique_ptr<folly::IOBuf>)
      const = 0;
  virtual bool deserializeFrom(Frame_SETUP&, std::unique_ptr<folly::IOBuf>)
      const = 0;
  virtual bool deserializeFrom(Frame_LEASE&, std::unique_ptr<folly::IOBuf>)
      const = 0;
  virtual bool deserializeFrom(Frame_RESUME&, std::unique_ptr<folly::IOBuf>)
      const = 0;
  virtual bool deserializeFrom(Frame_RESUME_OK&, std::unique_ptr<folly::IOBuf>)
      const = 0;

  virtual size_t frameLengthFieldSize() const = 0;
  bool& preallocateFrameSizeField();

 protected:
  folly::IOBufQueue createBufferQueue(size_t bufferSize) const;

 private:
  bool preallocateFrameSizeField_{false};
};

} // namespace rsocket
