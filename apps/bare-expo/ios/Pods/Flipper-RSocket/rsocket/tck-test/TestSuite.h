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

#include <string>
#include <vector>

namespace rsocket {
namespace tck {

class TestCommand {
 public:
  explicit TestCommand(std::vector<std::string> params)
      : params_(std::move(params)) {}

  const std::string& name() const {
    return params_[1];
  }

  template <typename T>
  T as() const {
    return T(*this);
  }

  const std::vector<std::string>& params() const {
    return params_;
  }

  bool valid() const;

 private:
  std::vector<std::string> params_;
};

class Test {
 public:
  const std::string& name() const {
    return name_;
  }

  void setName(const std::string& name) {
    name_ = name;
  }

  bool resumption() const {
    return resumption_;
  }

  void setResumption(bool resumption) {
    resumption_ = resumption;
  }

  void addCommand(TestCommand command);

  const std::vector<TestCommand>& commands() const {
    return commands_;
  }

  bool empty() const {
    return commands_.empty();
  }

 private:
  std::string name_;
  bool resumption_{false};
  std::vector<TestCommand> commands_;
};

class TestSuite {
 public:
  void addTest(Test test) {
    tests_.push_back(std::move(test));
  }

  const std::vector<Test>& tests() const {
    return tests_;
  }

 private:
  std::vector<Test> tests_;
};

} // namespace tck
} // namespace rsocket
