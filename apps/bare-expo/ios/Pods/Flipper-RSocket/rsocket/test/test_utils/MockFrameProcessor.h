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

#include <folly/ExceptionWrapper.h>
#include <folly/io/IOBuf.h>

#include "rsocket/framing/FrameProcessor.h"

namespace rsocket {

class MockFrameProcessor : public FrameProcessor {
 public:
  void processFrame(std::unique_ptr<folly::IOBuf> buf) override {
    processFrame_(buf);
  }

  void onTerminal(folly::exception_wrapper ew) override {
    onTerminal_(std::move(ew));
  }

  MOCK_METHOD1(processFrame_, void(std::unique_ptr<folly::IOBuf>&));
  MOCK_METHOD1(onTerminal_, void(folly::exception_wrapper));
};

} // namespace rsocket
