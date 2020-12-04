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

namespace yarpl {

/**
 * Represents a disposable resource.
 */
class Disposable {
 public:
  Disposable() {}
  virtual ~Disposable() = default;
  Disposable(Disposable&&) = delete;
  Disposable(const Disposable&) = delete;
  Disposable& operator=(Disposable&&) = delete;
  Disposable& operator=(const Disposable&) = delete;

  /**
   * Dispose the resource, the operation should be idempotent.
   */
  virtual void dispose() = 0;

  /**
   * Returns true if this resource has been disposed.
   * @return true if this resource has been disposed
   */
  virtual bool isDisposed() = 0;
};
} // namespace yarpl
