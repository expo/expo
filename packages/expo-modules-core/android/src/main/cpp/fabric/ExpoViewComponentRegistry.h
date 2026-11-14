// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <utility>

namespace expo {

class FrontendConverter;
using ExpoViewStateProps = std::unordered_map<std::string, std::shared_ptr<FrontendConverter>>;

class ExpoViewComponentRegistration {
public:
  ExpoViewComponentRegistration(std::string name, ExpoViewStateProps stateProps)
    : flavor(std::make_shared<const std::string>(std::move(name))),
      stateProps_(std::make_shared<const ExpoViewStateProps>(std::move(stateProps))) {}

  const std::shared_ptr<const std::string> flavor;

  std::shared_ptr<const ExpoViewStateProps> getStateProps() const {
    std::lock_guard lock(mutex_);
    return stateProps_;
  }

  void setStateProps(ExpoViewStateProps stateProps) {
    auto snapshot = std::make_shared<const ExpoViewStateProps>(std::move(stateProps));
    std::lock_guard lock(mutex_);
    stateProps_ = std::move(snapshot);
  }

private:
  mutable std::mutex mutex_;
  std::shared_ptr<const ExpoViewStateProps> stateProps_;
};

class ExpoViewComponentRegistry {
public:
  std::shared_ptr<ExpoViewComponentRegistration> registerComponent(
    std::string name,
    ExpoViewStateProps stateProps
  ) {
    std::lock_guard lock(mutex_);
    auto it = registrations_.find(name);
    if (it != registrations_.end()) {
      // AppContext reloads may change state props; retain only the current schema.
      it->second->setStateProps(std::move(stateProps));
      return it->second;
    }

    auto registration = std::make_shared<ExpoViewComponentRegistration>(
      name, std::move(stateProps)
    );
    registrations_.emplace(std::move(name), registration);
    return registration;
  }

  std::shared_ptr<ExpoViewComponentRegistration> find(const std::string &name) const {
    std::lock_guard lock(mutex_);
    auto it = registrations_.find(name);
    return it != registrations_.end() ? it->second : nullptr;
  }

private:
  mutable std::mutex mutex_;
  // RN retains providers for the process lifetime and identifies them by this name pointer.
  std::unordered_map<std::string, std::shared_ptr<ExpoViewComponentRegistration>> registrations_;
};

} // namespace expo
