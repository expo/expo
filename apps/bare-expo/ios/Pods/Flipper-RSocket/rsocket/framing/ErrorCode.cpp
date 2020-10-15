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

#include "rsocket/framing/ErrorCode.h"

#include <ostream>

namespace rsocket {

std::ostream& operator<<(std::ostream& os, ErrorCode errorCode) {
  switch (errorCode) {
    case ErrorCode::RESERVED:
      return os << "RESERVED";
    case ErrorCode::INVALID_SETUP:
      return os << "INVALID_SETUP";
    case ErrorCode::UNSUPPORTED_SETUP:
      return os << "UNSUPPORTED_SETUP";
    case ErrorCode::REJECTED_SETUP:
      return os << "REJECTED_SETUP";
    case ErrorCode::REJECTED_RESUME:
      return os << "REJECTED_RESUME";
    case ErrorCode::CONNECTION_ERROR:
      return os << "CONNECTION_ERROR";
    case ErrorCode::APPLICATION_ERROR:
      return os << "APPLICATION_ERROR";
    case ErrorCode::REJECTED:
      return os << "REJECTED";
    case ErrorCode::CANCELED:
      return os << "CANCELED";
    case ErrorCode::INVALID:
      return os << "INVALID";
  }
  return os << "ErrorCode[" << static_cast<uint32_t>(errorCode) << "]";
}
} // namespace rsocket
