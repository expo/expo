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

#include <folly/Conv.h>
#include <folly/String.h>

#include "rsocket/tck-test/TestSuite.h"

namespace rsocket {
namespace tck {

class TypedTestCommand {
 public:
  explicit TypedTestCommand(const TestCommand& command) : command_(command) {}

  const std::string& clientId() const {
    return command_.params().at(0);
  }

 protected:
  const TestCommand& command_;
};

class SubscribeCommand : public TypedTestCommand {
 public:
  using TypedTestCommand::TypedTestCommand;

  const std::string& type() const {
    return command_.params().at(2);
  }

  bool isRequestResponseType() const {
    return type() == "rr";
  }
  bool isRequestStreamType() const {
    return type() == "rs";
  }
  bool isFireAndForgetType() const {
    return type() == "fnf";
  }
  const std::string& id() const {
    return command_.params().at(3);
  }
  const std::string& payloadData() const {
    return command_.params().at(4);
  }
  const std::string& payloadMetadata() const {
    return command_.params().at(5);
  }
};

class RequestCommand : public TypedTestCommand {
 public:
  using TypedTestCommand::TypedTestCommand;

  int n() const {
    return folly::to<int>(command_.params().at(2));
  }
  const std::string& id() const {
    return command_.params().at(3);
  }
};

class CancelCommand : public TypedTestCommand {
 public:
  using TypedTestCommand::TypedTestCommand;

  const std::string& id() const {
    return command_.params().at(2);
  }
};

class ResumeCommand : public TypedTestCommand {
 public:
  using TypedTestCommand::TypedTestCommand;
};

class DisconnectCommand : public TypedTestCommand {
 public:
  using TypedTestCommand::TypedTestCommand;
};

class AwaitCommand : public TypedTestCommand {
 public:
  using TypedTestCommand::TypedTestCommand;

  const std::string& type() const {
    return command_.params().at(2);
  }
  bool isTerminalType() const {
    return type() == "terminal";
  }
  bool isAtLeastType() const {
    return type() == "atLeast";
  }
  bool isNoEventsType() const {
    return type() == "no_events";
  }
  const std::string& id() const {
    return command_.params().at(3);
  }
  int numElements() const {
    return folly::to<int>(command_.params().at(4));
  }
  int waitTime() const {
    return folly::to<int>(command_.params().at(4));
  }
};

class AssertCommand : public TypedTestCommand {
 public:
  using TypedTestCommand::TypedTestCommand;

  const std::string& assertion() const {
    return command_.params().at(2);
  }
  bool isNoErrorAssert() const {
    return assertion() == "no_error";
  }
  bool isErrorAssert() const {
    return assertion() == "error";
  }
  bool isReceivedAssert() const {
    return assertion() == "received";
  }
  bool isReceivedNAssert() const {
    return assertion() == "received_n";
  }
  bool isReceivedAtLeastAssert() const {
    return assertion() == "received_at_least";
  }
  bool isCompletedAssert() const {
    return assertion() == "completed";
  }
  bool isNotCompletedAssert() const {
    return assertion() == "no_completed";
  }
  bool isCanceledAssert() const {
    return assertion() == "canceled";
  }
  const std::string& id() const {
    return command_.params().at(3);
  }

  std::vector<std::pair<std::string, std::string>> values() const {
    const auto& valuesStr = command_.params().at(4);
    std::vector<std::string> items;
    folly::split("&&", valuesStr, items);

    std::vector<std::string> components;
    std::vector<std::pair<std::string, std::string>> values;
    for (const auto& item : items) {
      components.clear();
      folly::split(",", item, components);
      if (components.size() == 2) {
        values.emplace_back(std::make_pair(components[0], components[1]));
      } else {
        LOG(ERROR) << "wrong item in values string: " << item;
      }
    }
    return values;
  }

  size_t valueCount() const {
    return folly::to<size_t>(command_.params().at(4));
  }
};

} // namespace tck
} // namespace rsocket
