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

#include "rsocket/framing/FrameHeader.h"

#include <map>
#include <ostream>
#include <vector>

namespace rsocket {

namespace {

using FlagString = std::pair<FrameFlags, const char*>;

constexpr std::array<FlagString, 1> kMetadata = {
    {std::make_pair(FrameFlags::METADATA, "METADATA")}};
constexpr std::array<FlagString, 1> kKeepaliveRespond = {
    {std::make_pair(FrameFlags::KEEPALIVE_RESPOND, "KEEPALIVE_RESPOND")}};
constexpr std::array<FlagString, 2> kMetadataFollows = {
    {std::make_pair(FrameFlags::METADATA, "METADATA"),
     std::make_pair(FrameFlags::FOLLOWS, "FOLLOWS")}};
constexpr std::array<FlagString, 3> kMetadataResumeEnableLease = {
    {std::make_pair(FrameFlags::METADATA, "METADATA"),
     std::make_pair(FrameFlags::RESUME_ENABLE, "RESUME_ENABLE"),
     std::make_pair(FrameFlags::LEASE, "LEASE")}};
constexpr std::array<FlagString, 3> kMetadataFollowsComplete = {
    {std::make_pair(FrameFlags::METADATA, "METADATA"),
     std::make_pair(FrameFlags::FOLLOWS, "FOLLOWS"),
     std::make_pair(FrameFlags::COMPLETE, "COMPLETE")}};
constexpr std::array<FlagString, 4> kMetadataFollowsCompleteNext = {
    {std::make_pair(FrameFlags::METADATA, "METADATA"),
     std::make_pair(FrameFlags::FOLLOWS, "FOLLOWS"),
     std::make_pair(FrameFlags::COMPLETE, "COMPLETE"),
     std::make_pair(FrameFlags::NEXT, "NEXT")}};

template <size_t N>
constexpr auto toRange(const std::array<FlagString, N>& arr) {
  return folly::Range<const FlagString*>{arr.data(), arr.size()};
}

// constexpr -- Old versions of C++ compiler doesn't support
// compound-statements in constexpr function (no switch statement)
folly::Range<const FlagString*> allowedFlags(FrameType type) {
  switch (type) {
    case FrameType::SETUP:
      return toRange(kMetadataResumeEnableLease);
    case FrameType::LEASE:
    case FrameType::ERROR:
      return toRange(kMetadata);
    case FrameType::KEEPALIVE:
      return toRange(kKeepaliveRespond);
    case FrameType::REQUEST_RESPONSE:
    case FrameType::REQUEST_FNF:
    case FrameType::REQUEST_STREAM:
      return toRange(kMetadataFollows);
    case FrameType::REQUEST_CHANNEL:
      return toRange(kMetadataFollowsComplete);
    case FrameType::PAYLOAD:
      return toRange(kMetadataFollowsCompleteNext);
    default:
      return {};
  }
}

std::ostream&
writeFlags(std::ostream& os, FrameFlags frameFlags, FrameType frameType) {
  FrameFlags foundFlags = FrameFlags::EMPTY_;

  std::string delimiter;
  for (const auto& pair : allowedFlags(frameType)) {
    if (!!(frameFlags & pair.first)) {
      os << delimiter << pair.second;
      delimiter = "|";
      foundFlags |= pair.first;
    }
  }

  if (foundFlags != frameFlags) {
    os << frameFlags;
  } else if (delimiter.empty()) {
    os << "0x00";
  }
  return os;
}

} // namespace

std::ostream& operator<<(std::ostream& os, const FrameHeader& header) {
  os << header.type << "[";
  return writeFlags(os, header.flags, header.type)
      << ", " << header.streamId << "]";
}

} // namespace rsocket
