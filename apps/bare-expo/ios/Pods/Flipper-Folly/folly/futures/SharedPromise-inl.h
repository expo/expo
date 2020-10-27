/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

namespace folly {

template <class T>
size_t SharedPromise<T>::size() const {
  std::lock_guard<std::mutex> g(mutex_);
  return size_.value;
}

template <class T>
SemiFuture<T> SharedPromise<T>::getSemiFuture() const {
  std::lock_guard<std::mutex> g(mutex_);
  size_.value++;
  if (hasResult()) {
    return makeFuture<T>(Try<T>(try_.value));
  } else {
    promises_.emplace_back();
    if (interruptHandler_) {
      promises_.back().setInterruptHandler(interruptHandler_);
    }
    return promises_.back().getSemiFuture();
  }
}

template <class T>
Future<T> SharedPromise<T>::getFuture() const {
  return getSemiFuture().via(&InlineExecutor::instance());
}

template <class T>
template <class E>
typename std::enable_if<std::is_base_of<std::exception, E>::value>::type
SharedPromise<T>::setException(E const& e) {
  setTry(Try<T>(e));
}

template <class T>
void SharedPromise<T>::setException(exception_wrapper ew) {
  setTry(Try<T>(std::move(ew)));
}

template <class T>
void SharedPromise<T>::setInterruptHandler(
    std::function<void(exception_wrapper const&)> fn) {
  std::lock_guard<std::mutex> g(mutex_);
  if (hasResult()) {
    return;
  }
  interruptHandler_ = fn;
  for (auto& p : promises_) {
    p.setInterruptHandler(fn);
  }
}

template <class T>
template <class M>
void SharedPromise<T>::setValue(M&& v) {
  setTry(Try<T>(std::forward<M>(v)));
}

template <class T>
template <class F>
void SharedPromise<T>::setWith(F&& func) {
  setTry(makeTryWith(std::forward<F>(func)));
}

template <class T>
void SharedPromise<T>::setTry(Try<T>&& t) {
  std::vector<Promise<T>> promises;

  {
    std::lock_guard<std::mutex> g(mutex_);
    if (hasResult()) {
      throw_exception<PromiseAlreadySatisfied>();
    }
    try_.value = std::move(t);
    promises.swap(promises_);
  }

  for (auto& p : promises) {
    p.setTry(Try<T>(try_.value));
  }
}

template <class T>
bool SharedPromise<T>::isFulfilled() const {
  std::lock_guard<std::mutex> g(mutex_);
  return hasResult();
}

} // namespace folly
