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

#include <gmock/gmock.h>

#include "rsocket/DuplexConnection.h"
#include "yarpl/test_utils/Mocks.h"

namespace rsocket {

class MockDuplexConnection : public DuplexConnection {
 public:
  using Subscriber = DuplexConnection::Subscriber;

  MockDuplexConnection() {}

  /// Creates a DuplexConnection that always runs `in` on the input subscriber.
  template <class InputFn>
  MockDuplexConnection(InputFn in) {
    EXPECT_CALL(*this, setInput_(testing::_))
        .WillRepeatedly(testing::Invoke(std::move(in)));
  }

  // DuplexConnection.

  void setInput(std::shared_ptr<Subscriber> in) override {
    setInput_(std::move(in));
  }

  void send(std::unique_ptr<folly::IOBuf> buf) override {
    send_(buf);
  }

  // Mocks.

  MOCK_METHOD1(setInput_, void(std::shared_ptr<Subscriber>));
  MOCK_METHOD1(send_, void(std::unique_ptr<folly::IOBuf>&));
  MOCK_CONST_METHOD0(isFramed, bool());
};

} // namespace rsocket
