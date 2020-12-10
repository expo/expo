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

#include <folly/io/IOBuf.h>
#include <memory>
#include <string>

namespace rsocket {

/// The type of a read-only view on a binary buffer.
/// MUST manage the lifetime of the underlying buffer.
struct Payload {
  Payload() = default;

  explicit Payload(
      std::unique_ptr<folly::IOBuf> data,
      std::unique_ptr<folly::IOBuf> metadata = std::unique_ptr<folly::IOBuf>());

  explicit Payload(
      folly::StringPiece data,
      folly::StringPiece metadata = folly::StringPiece{});

  explicit operator bool() const {
    return data != nullptr || metadata != nullptr;
  }

  std::string moveDataToString();
  std::string cloneDataToString() const;

  std::string moveMetadataToString();
  std::string cloneMetadataToString() const;

  void clear();

  Payload clone() const;

  std::unique_ptr<folly::IOBuf> data;
  std::unique_ptr<folly::IOBuf> metadata;
};

struct ErrorWithPayload : public std::exception {
  explicit ErrorWithPayload(Payload&& payload);

  // folly::ExceptionWrapper requires exceptions to have copy constructors
  ErrorWithPayload(const ErrorWithPayload& oth);
  ErrorWithPayload& operator=(const ErrorWithPayload&);
  ErrorWithPayload(ErrorWithPayload&&) = default;
  ErrorWithPayload& operator=(ErrorWithPayload&&) = default;

  const char* what() const noexcept override {
    return "ErrorWithPayload";
  }

  Payload payload;
};

std::ostream& operator<<(std::ostream& os, const Payload&);
std::ostream& operator<<(std::ostream& os, const ErrorWithPayload&);

} // namespace rsocket
