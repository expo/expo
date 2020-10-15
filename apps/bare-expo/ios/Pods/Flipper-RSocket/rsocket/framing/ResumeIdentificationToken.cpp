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

#include "rsocket/framing/ResumeIdentificationToken.h"

#include <limits>
#include <ostream>
#include <sstream>
#include <stdexcept>

#include <folly/Random.h>
#include <glog/logging.h>

namespace rsocket {

constexpr const char* kHexChars = "0123456789abcdef";

ResumeIdentificationToken::ResumeIdentificationToken() {}

ResumeIdentificationToken::ResumeIdentificationToken(const std::string& token) {
  const auto getNibble = [&token](size_t i) {
    uint8_t nibble;
    if (token[i] >= '0' && token[i] <= '9') {
      nibble = token[i] - '0';
    } else if (token[i] >= 'a' && token[i] <= 'f') {
      nibble = token[i] - 'a' + 10;
    } else {
      throw std::invalid_argument("ResumeToken not in right format: " + token);
    }
    return nibble;
  };
  if (token.size() < 2 || token[0] != '0' || token[1] != 'x' ||
      (token.size() % 2) != 0) {
    throw std::invalid_argument("ResumeToken not in right format: " + token);
  }
  size_t i = 2;
  while (i < token.size()) {
    const uint8_t firstNibble = getNibble(i++);
    const uint8_t secondNibble = getNibble(i++);
    bits_.push_back((firstNibble << 4) | secondNibble);
  }
}

ResumeIdentificationToken ResumeIdentificationToken::generateNew() {
  constexpr size_t kSize = 16;
  std::vector<uint8_t> data;
  data.reserve(kSize);
  for (size_t i = 0; i < kSize; i++) {
    data.push_back(static_cast<uint8_t>(folly::Random::rand32()));
  }
  return ResumeIdentificationToken(std::move(data));
}

void ResumeIdentificationToken::set(std::vector<uint8_t> newBits) {
  CHECK(newBits.size() <= std::numeric_limits<uint16_t>::max());
  bits_ = std::move(newBits);
}

std::string ResumeIdentificationToken::str() const {
  std::stringstream out;
  out << *this;
  return out.str();
}

std::ostream& operator<<(
    std::ostream& out,
    const ResumeIdentificationToken& token) {
  out << "0x";
  for (const auto b : token.data()) {
    out << kHexChars[(b & 0xF0) >> 4];
    out << kHexChars[b & 0x0F];
  }
  return out;
}

} // namespace rsocket
