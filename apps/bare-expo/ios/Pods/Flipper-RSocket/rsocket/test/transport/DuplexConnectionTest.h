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

#include <folly/io/async/EventBase.h>

#include "rsocket/DuplexConnection.h"

namespace rsocket {
namespace tests {

void makeMultipleSetInputGetOutputCalls(
    std::unique_ptr<rsocket::DuplexConnection> serverConnection,
    folly::EventBase* serverEvb,
    std::unique_ptr<rsocket::DuplexConnection> clientConnection,
    folly::EventBase* clientEvb);

void verifyInputAndOutputIsUntied(
    std::unique_ptr<rsocket::DuplexConnection> serverConnection,
    folly::EventBase* serverEvb,
    std::unique_ptr<rsocket::DuplexConnection> clientConnection,
    folly::EventBase* clientEvb);

void verifyClosingInputAndOutputDoesntCloseConnection(
    std::unique_ptr<rsocket::DuplexConnection> serverConnection,
    folly::EventBase* serverEvb,
    std::unique_ptr<rsocket::DuplexConnection> clientConnection,
    folly::EventBase* clientEvb);

} // namespace tests
} // namespace rsocket
