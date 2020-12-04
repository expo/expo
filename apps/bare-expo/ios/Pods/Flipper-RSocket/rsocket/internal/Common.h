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

#include <chrono>
#include <cstdint>
#include <functional>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

//
// this file includes all PUBLIC common types.
//

namespace folly {
class exception_wrapper;
class IOBuf;

template <typename T>
class Range;
typedef Range<const char*> StringPiece;
} // namespace folly

namespace rsocket {

/// A unique identifier of a stream.
using StreamId = uint32_t;

constexpr std::chrono::seconds kDefaultKeepaliveInterval{5};

constexpr int64_t kMaxRequestN = std::numeric_limits<int32_t>::max();

std::string humanify(std::unique_ptr<folly::IOBuf> const&);
std::string hexDump(folly::StringPiece s);

/// Indicates the reason why the stream stateMachine received a terminal signal
/// from the connection.
enum class StreamCompletionSignal {
  CANCEL,
  COMPLETE,
  APPLICATION_ERROR,
  ERROR,
  INVALID_SETUP,
  UNSUPPORTED_SETUP,
  REJECTED_SETUP,
  CONNECTION_ERROR,
  CONNECTION_END,
  SOCKET_CLOSED,
};

enum class RSocketMode : uint8_t { SERVER, CLIENT };

std::ostream& operator<<(std::ostream&, RSocketMode);

enum class StreamType {
  REQUEST_RESPONSE,
  STREAM,
  CHANNEL,
  FNF,
};

folly::StringPiece toString(StreamType);
std::ostream& operator<<(std::ostream&, StreamType);

enum class RequestOriginator {
  LOCAL,
  REMOTE,
};

std::string to_string(StreamCompletionSignal);
std::ostream& operator<<(std::ostream&, StreamCompletionSignal);

class StreamInterruptedException : public std::runtime_error {
 public:
  explicit StreamInterruptedException(int _terminatingSignal);
  const int terminatingSignal;
};

class FrameSink;

} // namespace rsocket
