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

#include <cstdint>
#include <iosfwd>

namespace rsocket {

enum class ErrorCode : uint32_t {
  RESERVED = 0x00000000,
  // The Setup frame is invalid for the server (it could be that the client is
  // too recent for the old server). Stream ID MUST be 0.
  INVALID_SETUP = 0x00000001,
  // Some (or all) of the parameters specified by the client are unsupported by
  // the server. Stream ID MUST be 0.
  UNSUPPORTED_SETUP = 0x00000002,
  // The server rejected the setup, it can specify the reason in the payload.
  // Stream ID MUST be 0.
  REJECTED_SETUP = 0x00000003,
  // The server rejected the resume, it can specify the reason in the payload.
  // Stream ID MUST be 0.
  REJECTED_RESUME = 0x00000004,
  // The connection is being terminated. Stream ID MUST be 0.
  CONNECTION_ERROR = 0x00000101,
  // Application layer logic generating a Reactive Streams onError event.
  // Stream ID MUST be non-0.
  APPLICATION_ERROR = 0x00000201,
  // Despite being a valid request, the Responder decided to reject it. The
  // Responder guarantees that it didn't process the request. The reason for the
  // rejection is explained in the metadata section. Stream ID MUST be non-0.
  REJECTED = 0x00000202,
  // The responder canceled the request but potentially have started processing
  // it (almost identical to REJECTED but doesn't garantee that no side-effect
  // have been started). Stream ID MUST be non-0.
  CANCELED = 0x00000203,
  // The request is invalid. Stream ID MUST be non-0.
  INVALID = 0x00000204,
  // EXT = 0xFFFFFFFF,
};

std::ostream& operator<<(std::ostream&, ErrorCode);
} // namespace rsocket
