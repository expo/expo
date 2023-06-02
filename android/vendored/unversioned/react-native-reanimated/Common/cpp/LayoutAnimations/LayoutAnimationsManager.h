#pragma once

#include "ErrorHandler.h"
#include "LayoutAnimationType.h"
#include "Shareables.h"

#include <jsi/jsi.h>
#include <stdio.h>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

namespace reanimated {

using namespace facebook;

class LayoutAnimationsManager {
 public:
  void configureAnimation(
      int tag,
      LayoutAnimationType type,
      const std::string &sharedTransitionTag,
      std::shared_ptr<Shareable> config);
  bool hasLayoutAnimation(int tag, LayoutAnimationType type);
  void startLayoutAnimation(
      jsi::Runtime &rt,
      int tag,
      LayoutAnimationType type,
      const jsi::Object &values);
  void clearLayoutAnimationConfig(int tag);
  void cancelLayoutAnimation(
      jsi::Runtime &rt,
      int tag,
      LayoutAnimationType type,
      bool cancelled /* = true */,
      bool removeView /* = true */);
  int findPrecedingViewTagForTransition(int tag);

 private:
  std::unordered_map<int, std::shared_ptr<Shareable>> &getConfigsForType(
      LayoutAnimationType type);

  std::unordered_map<int, std::shared_ptr<Shareable>> enteringAnimations_;
  std::unordered_map<int, std::shared_ptr<Shareable>> exitingAnimations_;
  std::unordered_map<int, std::shared_ptr<Shareable>> layoutAnimations_;
  std::unordered_map<int, std::shared_ptr<Shareable>>
      sharedTransitionAnimations_;
  std::unordered_map<std::string, std::vector<int>> sharedTransitionGroups_;
  std::unordered_map<int, std::string> viewTagToSharedTag_;
  mutable std::mutex
      animationsMutex_; // Protects `enteringAnimations_`, `exitingAnimations_`,
                        // `layoutAnimations_` and `viewSharedValues_`.
};

} // namespace reanimated
