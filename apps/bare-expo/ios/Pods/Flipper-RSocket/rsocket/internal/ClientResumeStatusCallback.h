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

#include "rsocket/RSocketException.h"

namespace rsocket {
class ClientResumeStatusCallback {
 public:
  virtual ~ClientResumeStatusCallback() = default;

  // Called when a RESUME_OK frame is received during resuming operation
  virtual void onResumeOk() noexcept = 0;

  // The exception could be one of ResumptionException or ConnectionException
  virtual void onResumeError(folly::exception_wrapper ex) noexcept = 0;
};

} // namespace rsocket
