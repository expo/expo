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

#include "yarpl/single/Single.h"
#include "yarpl/single/SingleSubscriptions.h"

#include <folly/functional/Invoke.h>

namespace yarpl {
namespace single {

class Singles {
 public:
  template <typename T>
  static std::shared_ptr<Single<T>> just(const T& value) {
    auto lambda = [value](std::shared_ptr<SingleObserver<T>> observer) {
      observer->onSubscribe(SingleSubscriptions::empty());
      observer->onSuccess(value);
    };

    return Single<T>::create(std::move(lambda));
  }

  template <
      typename T,
      typename OnSubscribe,
      typename = typename std::enable_if<folly::is_invocable<
          OnSubscribe&&,
          std::shared_ptr<SingleObserver<T>>>::value>::type>
  static std::shared_ptr<Single<T>> create(OnSubscribe&& function) {
    return std::make_shared<
        FromPublisherOperator<T, std::decay_t<OnSubscribe>>>(
        std::forward<OnSubscribe>(function));
  }

  template <typename T>
  static std::shared_ptr<Single<T>> error(folly::exception_wrapper ex) {
    auto lambda =
        [e = std::move(ex)](std::shared_ptr<SingleObserver<T>> observer) {
          observer->onSubscribe(SingleSubscriptions::empty());
          observer->onError(e);
        };
    return Single<T>::create(std::move(lambda));
  }

  template <typename T, typename ExceptionType>
  static std::shared_ptr<Single<T>> error(const ExceptionType& ex) {
    auto lambda = [ex](std::shared_ptr<SingleObserver<T>> observer) {
      observer->onSubscribe(SingleSubscriptions::empty());
      observer->onError(ex);
    };
    return Single<T>::create(std::move(lambda));
  }

  template <typename T, typename TGenerator>
  static std::shared_ptr<Single<T>> fromGenerator(TGenerator&& generator) {
    auto lambda = [generator = std::forward<TGenerator>(generator)](
                      std::shared_ptr<SingleObserver<T>> observer) mutable {
      observer->onSubscribe(SingleSubscriptions::empty());
      observer->onSuccess(generator());
    };
    return Single<T>::create(std::move(lambda));
  }

 private:
  Singles() = delete;
};

} // namespace single
} // namespace yarpl
