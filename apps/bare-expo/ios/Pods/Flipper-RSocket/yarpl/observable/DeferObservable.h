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

#include "yarpl/observable/Observable.h"

namespace yarpl {
namespace observable {
namespace details {

template <typename T, typename ObservableFactory>
class DeferObservable : public Observable<T> {
  static_assert(
      std::is_same<std::decay_t<ObservableFactory>, ObservableFactory>::value,
      "undecayed");

 public:
  template <typename F>
  explicit DeferObservable(F&& factory) : factory_(std::forward<F>(factory)) {}

  virtual std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<T>> observer) {
    std::shared_ptr<Observable<T>> observable;
    try {
      observable = factory_();
    } catch (const std::exception& ex) {
      observable = Observable<T>::error(ex, std::current_exception());
    }
    return observable->subscribe(std::move(observer));
  }

 private:
  ObservableFactory factory_;
};

} // namespace details
} // namespace observable
} // namespace yarpl
