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

#include <folly/ExceptionWrapper.h>
#include <folly/io/IOBuf.h>

namespace rsocket {

class FrameProcessor {
 public:
  virtual ~FrameProcessor() = default;

  virtual void processFrame(std::unique_ptr<folly::IOBuf>) = 0;
  virtual void onTerminal(folly::exception_wrapper) = 0;
};

} // namespace rsocket
