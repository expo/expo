// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <jsi/jsi.h>
#include <memory>

namespace jsi = facebook::jsi;

namespace expo {
struct MethodMetadata {
  std::string name;
  int args;
  bool isAsync;

  std::shared_ptr<jsi::Function> body = nullptr;

  MethodMetadata(std::string name, int args, bool isAsync)
    : name(name), args(args), isAsync(isAsync) {};
};
}
