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

#include "yarpl/flowable/Flowables.h"

namespace yarpl {
namespace flowable {

std::shared_ptr<Flowable<int64_t>> Flowable<>::range(
    int64_t start,
    int64_t count) {
  auto lambda = [start, count, i = start](
                    Subscriber<int64_t>& subscriber,
                    int64_t requested) mutable {
    int64_t end = start + count;

    while (i < end && requested-- > 0) {
      subscriber.onNext(i++);
    }

    if (i >= end) {
      // TODO T27302402: Even though having two subscriptions exist concurrently
      // for Emitters is not possible still. At least it possible to resubscribe
      // and consume the same values again.
      i = start;
      subscriber.onComplete();
    }
  };
  return Flowable<int64_t>::create(std::move(lambda));
}

} // namespace flowable
} // namespace yarpl
