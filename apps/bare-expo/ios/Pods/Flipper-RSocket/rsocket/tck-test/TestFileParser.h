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

#include <fstream>

#include "rsocket/tck-test/TestSuite.h"

namespace rsocket {
namespace tck {

class TestFileParser {
 public:
  explicit TestFileParser(const std::string& fileName);

  TestSuite parse();

 private:
  void parseCommand(const std::string& command);
  void addCurrentTest();

  std::ifstream input_;
  int currentLine_;

  TestSuite testSuite_;
  Test currentTest_;
};

} // namespace tck
} // namespace rsocket
