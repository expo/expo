// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewTraits.h"

#include <mutex>
#include <unordered_map>

namespace expo {

namespace {

std::mutex &registryMutex() {
  static std::mutex mutex;
  return mutex;
}

std::unordered_map<std::string, facebook::react::ShadowNodeTraits> &registry() {
  static std::unordered_map<std::string, facebook::react::ShadowNodeTraits> map;
  return map;
}

} // namespace

void ExpoViewTraits::declare(const std::string &componentName, facebook::react::ShadowNodeTraits traits) {
  std::lock_guard<std::mutex> lock(registryMutex());
  registry()[componentName] = traits;
}

facebook::react::ShadowNodeTraits ExpoViewTraits::declaredFor(const std::string &componentName) {
  std::lock_guard<std::mutex> lock(registryMutex());
  auto it = registry().find(componentName);
  return it != registry().end() ? it->second : facebook::react::ShadowNodeTraits{};
}

} // namespace expo
