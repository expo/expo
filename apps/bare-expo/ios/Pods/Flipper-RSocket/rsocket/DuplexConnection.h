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

#include <memory>

#include <folly/io/IOBuf.h>

#include "yarpl/flowable/Subscriber.h"

namespace rsocket {

/// Represents a connection of the underlying protocol, on top of which the
/// RSocket protocol is layered.  The underlying protocol MUST provide an
/// ordered, guaranteed, bidirectional transport of frames.  Moreover, frame
/// boundaries MUST be preserved.
///
/// The frames exchanged through this interface are serialized, and lack the
/// optional frame length field.  Presence of the field is determined by the
/// underlying protocol.  If the protocol natively supports framing
/// (e.g. Aeron), the fileld MUST be omitted, otherwise (e.g. TCP) it must be
/// present.  The RSocket implementation MUST NOT be provided with a frame that
/// contains the length field nor can it ever send such a frame.
///
/// It can be assumed that both input and output will be closed by sending
/// appropriate terminal signals (according to ReactiveStreams specification)
/// before the connection is destroyed.
class DuplexConnection {
 public:
  using Subscriber = yarpl::flowable::Subscriber<std::unique_ptr<folly::IOBuf>>;

  virtual ~DuplexConnection() = default;

  /// Sets a Subscriber that will consume received frames (a reader).
  ///
  /// If setInput() has already been called, then calling setInput() again will
  /// complete the previous subscriber.
  virtual void setInput(std::shared_ptr<Subscriber>) = 0;

  /// Write a serialized frame to the connection.
  ///
  /// Does nothing if the underlying connection is closed.
  virtual void send(std::unique_ptr<folly::IOBuf>) = 0;

  /// Whether the duplex connection respects frame boundaries.
  virtual bool isFramed() const {
    return false;
  }
};

} // namespace rsocket
