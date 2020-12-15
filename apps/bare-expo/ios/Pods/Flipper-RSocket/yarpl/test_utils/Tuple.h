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

#include <atomic>
#include <iostream>

namespace yarpl {

struct Tuple {
  const int a;
  const int b;

  Tuple(const int _a, const int _b) : a(_a), b(_b) {
    std::cout << "Tuple (" << a << ", " << b << ") constructed." << std::endl;
    instanceCount++;
    createdCount++;
  }

  Tuple(const Tuple& t) : a(t.a), b(t.b) {
    std::cout << "Tuple (" << a << ", " << b << ") copy-constructed."
              << std::endl;
    instanceCount++;
    createdCount++;
  }

  Tuple(Tuple&& t) noexcept : a(std::move(t.a)), b(std::move(t.b)) {
    std::cout << "Tuple (" << a << ", " << b << ") move-constructed."
              << std::endl;
    instanceCount++;
    createdCount++;
  }

  ~Tuple() {
    std::cout << "Tuple (" << a << ", " << b << ") destroyed." << std::endl;
    std::cout << "Tuple destroyed!!" << std::endl;
    instanceCount--;
    destroyedCount++;
  }

  static std::atomic<int> createdCount;
  static std::atomic<int> destroyedCount;
  static std::atomic<int> instanceCount;
};

} // namespace yarpl
