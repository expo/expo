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

#include <folly/SocketAddress.h>
#include <folly/io/async/ScopedEventBaseThread.h>
#include "rsocket/Payload.h"
#include "rsocket/RSocket.h"
#include "rsocket/RSocketRequester.h"

#include "rsocket/tck-test/BaseSubscriber.h"
#include "rsocket/tck-test/TestSuite.h"

namespace folly {
class EventBase;
}

namespace rsocket {

class ReactiveSocket;

namespace tck {

class SubscribeCommand;
class RequestCommand;
class AwaitCommand;
class CancelCommand;
class AssertCommand;
class ResumeCommand;
class DisconnectCommand;

class TestInterpreter {
  class TestClient {
   public:
    explicit TestClient(std::shared_ptr<RSocketClient> c)
        : client(std::move(c)) {
      auto rs = client->getRequester();
      requester = std::move(rs);
    }
    std::shared_ptr<RSocketClient> client;
    std::shared_ptr<RSocketRequester> requester;
  };

 public:
  TestInterpreter(const Test& test, folly::SocketAddress address);

  bool run();

 private:
  void handleSubscribe(const SubscribeCommand& command);
  void handleRequest(const RequestCommand& command);
  void handleAwait(const AwaitCommand& command);
  void handleCancel(const CancelCommand& command);
  void handleAssert(const AssertCommand& command);
  void handleDisconnect(const DisconnectCommand& command);
  void handleResume(const ResumeCommand& command);

  std::shared_ptr<BaseSubscriber> getSubscriber(const std::string& id);

  folly::ScopedEventBaseThread worker_;
  folly::SocketAddress address_;
  const Test& test_;
  std::map<std::string, std::string> interactionIdToType_;
  std::map<std::string, std::shared_ptr<BaseSubscriber>> testSubscribers_;
  std::map<std::string, std::shared_ptr<TestClient>> testClient_;
};

} // namespace tck
} // namespace rsocket
