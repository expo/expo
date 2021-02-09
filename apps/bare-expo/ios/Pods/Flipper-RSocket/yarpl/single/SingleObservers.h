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

#include "yarpl/single/SingleObserver.h"

#include <folly/functional/Invoke.h>

namespace yarpl {
namespace single {

/// Helper methods for constructing subscriber instances from functions:
/// one or two functions (callables; can be lamda, for instance)
/// may be specified, corresponding to onNext, onError and onComplete
/// method bodies in the subscriber.
class SingleObservers {
 private:
  /// Defined if Success and Error are signature-compatible with
  /// onSuccess and onError subscriber methods respectively.
  template <
      typename T,
      typename Success,
      typename Error = void (*)(folly::exception_wrapper)>
  using EnableIfCompatible = typename std::enable_if<
      folly::is_invocable<std::decay_t<Success>&, T>::value &&
      folly::is_invocable<std::decay_t<Error>&, folly::exception_wrapper>::
          value>::type;

 public:
  template <typename T, typename Next, typename = EnableIfCompatible<T, Next>>
  static auto create(Next&& next) {
    return std::make_shared<Base<T, std::decay_t<Next>>>(
        std::forward<Next>(next));
  }

  template <
      typename T,
      typename Success,
      typename Error,
      typename = EnableIfCompatible<T, Success, Error>>
  static auto create(Success&& next, Error&& error) {
    return std::make_shared<
        WithError<T, std::decay_t<Success>, std::decay_t<Error>>>(
        std::forward<Success>(next), std::forward<Error>(error));
  }

  template <typename T>
  static auto create() {
    return std::make_shared<SingleObserverBase<T>>();
  }

 private:
  template <typename T, typename Next>
  class Base : public SingleObserverBase<T> {
    static_assert(std::is_same<std::decay_t<Next>, Next>::value, "undecayed");

   public:
    template <typename FNext>
    explicit Base(FNext&& next) : next_(std::forward<FNext>(next)) {}

    void onSuccess(T value) override {
      next_(std::move(value));
      // TODO how do we call the super to trigger release?
      //      SingleObserver<T>::onSuccess(value);
    }

   private:
    Next next_;
  };

  template <typename T, typename Success, typename Error>
  class WithError : public Base<T, Success> {
    static_assert(std::is_same<std::decay_t<Error>, Error>::value, "undecayed");

   public:
    template <typename FSuccess, typename FError>
    WithError(FSuccess&& success, FError&& error)
        : Base<T, Success>(std::forward<FSuccess>(success)),
          error_(std::forward<FError>(error)) {}

    void onError(folly::exception_wrapper error) override {
      error_(error);
      // TODO do we call the super here to trigger release?
      Base<T, Success>::onError(std::move(error));
    }

   private:
    Error error_;
  };

  SingleObservers() = delete;
};

} // namespace single
} // namespace yarpl
