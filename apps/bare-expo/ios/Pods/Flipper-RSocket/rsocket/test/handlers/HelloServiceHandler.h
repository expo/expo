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

#include <map>
#include "rsocket/RSocketServiceHandler.h"

namespace rsocket {
namespace tests {

// A minimal RSocketServiceHandler which supports resumption.

class HelloServiceHandler : public RSocketServiceHandler {
 public:
  explicit HelloServiceHandler(
      std::shared_ptr<RSocketConnectionEvents> connEvents = nullptr)
      : connectionEvents_(connEvents) {}

  folly::Expected<RSocketConnectionParams, RSocketException> onNewSetup(
      const SetupParameters&) override;

  void onNewRSocketState(
      std::shared_ptr<RSocketServerState> state,
      ResumeIdentificationToken token) override;

  folly::Expected<std::shared_ptr<RSocketServerState>, RSocketException>
  onResume(ResumeIdentificationToken token) override;

 private:
  std::shared_ptr<RSocketConnectionEvents> connectionEvents_;
  folly::Synchronized<
      std::map<ResumeIdentificationToken, std::shared_ptr<RSocketServerState>>,
      std::mutex>
      store_;
};

} // namespace tests
} // namespace rsocket
