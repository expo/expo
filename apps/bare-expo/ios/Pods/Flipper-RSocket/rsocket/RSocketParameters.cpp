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

#include "rsocket/RSocketParameters.h"

#include <folly/String.h>

namespace rsocket {
std::ostream& operator<<(
    std::ostream& os,
    const SetupParameters& setupPayload) {
  return os << "metadataMimeType: " << setupPayload.metadataMimeType
            << " dataMimeType: " << setupPayload.dataMimeType
            << " payload: " << setupPayload.payload
            << " token: " << setupPayload.token
            << " resumable: " << setupPayload.resumable;
}
} // namespace rsocket
