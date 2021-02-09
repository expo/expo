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
#include "rsocket/Payload.h"
#include "yarpl/Flowable.h"
#include "yarpl/Single.h"

namespace rsocket {
namespace tck {

class MarbleProcessor {
 public:
  explicit MarbleProcessor(const std::string /* marble */);

  void run(
      yarpl::flowable::Subscriber<rsocket::Payload>& subscriber,
      int64_t requested);

  void run(std::shared_ptr<yarpl::single::SingleObserver<rsocket::Payload>>
               subscriber);

 private:
  std::string marble_;

  // Stores a mapping from marble character to Payload (data, metadata)
  std::map<std::string, std::pair<std::string, std::string>> argMap_;

  // Keeps an account of how many messages can be sent.  This could be done
  // with Allowance
  std::atomic<size_t> canSend_{0};

  size_t index_{0};
};

} // namespace tck
} // namespace rsocket
