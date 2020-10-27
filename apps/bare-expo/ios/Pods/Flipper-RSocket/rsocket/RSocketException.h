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

#include <stdexcept>

namespace rsocket {

class RSocketException : public std::runtime_error {
  using std::runtime_error::runtime_error;
};

// Thrown when an ERROR frame with CONNECTION_ERROR or REJECTED_RESUME is
// received during resumption.
class ResumptionException : public RSocketException {
  using RSocketException::RSocketException;
};

// Thrown when the resume operation was interrupted due to network.
// The application may try to resume again.
class ConnectionException : public RSocketException {
  using RSocketException::RSocketException;
};
} // namespace rsocket
