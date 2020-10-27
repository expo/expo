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

#include <functional>
#include <iosfwd>
#include <string>
#include <vector>

#include "rsocket/Payload.h"
#include "rsocket/framing/Frame.h"

namespace rsocket {

using OnRSocketResume =
    std::function<bool(std::vector<StreamId>, std::vector<StreamId>)>;

class RSocketParameters {
 public:
  RSocketParameters(bool resume, ProtocolVersion version)
      : resumable{resume}, protocolVersion{std::move(version)} {}

  bool resumable;
  ProtocolVersion protocolVersion;
};

class SetupParameters : public RSocketParameters {
 public:
  explicit SetupParameters(
      std::string metadataMime = "text/plain",
      std::string dataMime = "text/plain",
      Payload buf = Payload(),
      bool resume = false,
      ResumeIdentificationToken resumeToken =
          ResumeIdentificationToken::generateNew(),
      ProtocolVersion version = ProtocolVersion::Latest)
      : RSocketParameters(resume, version),
        metadataMimeType(std::move(metadataMime)),
        dataMimeType(std::move(dataMime)),
        payload(std::move(buf)),
        token(resumeToken) {}

  std::string metadataMimeType;
  std::string dataMimeType;
  Payload payload;
  ResumeIdentificationToken token;
};

std::ostream& operator<<(std::ostream&, const SetupParameters&);

class ResumeParameters : public RSocketParameters {
 public:
  ResumeParameters(
      ResumeIdentificationToken resumeToken,
      ResumePosition serverPos,
      ResumePosition clientPos,
      ProtocolVersion version)
      : RSocketParameters(true, version),
        token(std::move(resumeToken)),
        serverPosition(serverPos),
        clientPosition(clientPos) {}

  ResumeIdentificationToken token;
  ResumePosition serverPosition;
  ResumePosition clientPosition;
};

} // namespace rsocket
