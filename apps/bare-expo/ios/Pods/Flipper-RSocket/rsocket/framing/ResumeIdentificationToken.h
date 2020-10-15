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
#include <string>
#include <vector>

namespace rsocket {

class ResumeIdentificationToken {
 public:
  /// Creates an empty token.
  ResumeIdentificationToken();

  // The string token and ::str() function should complement each other.  The
  // string representation should be of the format
  // 0x44ab7cf01fd290b63140d01ee789cfb6
  explicit ResumeIdentificationToken(const std::string&);

  static ResumeIdentificationToken generateNew();

  const std::vector<uint8_t>& data() const {
    return bits_;
  }

  void set(std::vector<uint8_t> newBits);

  bool operator==(const ResumeIdentificationToken& right) const {
    return data() == right.data();
  }

  bool operator!=(const ResumeIdentificationToken& right) const {
    return data() != right.data();
  }

  bool operator<(const ResumeIdentificationToken& right) const {
    return data() < right.data();
  }

  std::string str() const;

 private:
  explicit ResumeIdentificationToken(std::vector<uint8_t> bits)
      : bits_(std::move(bits)) {}

  std::vector<uint8_t> bits_;
};

std::ostream& operator<<(std::ostream&, const ResumeIdentificationToken&);

} // namespace rsocket
