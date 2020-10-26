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

#include "yarpl/observable/Observables.h"

namespace yarpl {
namespace observable {

std::shared_ptr<Observable<int64_t>> Observable<>::range(
    int64_t start,
    int64_t count) {
  auto lambda = [start, count](std::shared_ptr<Observer<int64_t>> observer) {
    auto end = start + count;
    for (int64_t i = start; i < end; ++i) {
      observer->onNext(i);
    }
    observer->onComplete();
  };

  return Observable<int64_t>::create(std::move(lambda));
}
} // namespace observable
} // namespace yarpl
