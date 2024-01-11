#pragma once

#include "JSLogger.h"
#include "LayoutAnimationType.h"
#include "Shareables.h"

#include <jsi/jsi.h>
#include <stdio.h>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace reanimated {

using namespace facebook;

class LayoutAnimationsManager {
 public:
  explicit LayoutAnimationsManager(const std::shared_ptr<JSLogger> &jsLogger)
      : jsLogger_(jsLogger) {}
  void configureAnimation(
      int tag,
      LayoutAnimationType type,
      const std::string &sharedTransitionTag,
      std::shared_ptr<Shareable> config);
  void setShouldAnimateExiting(int tag, bool value);
  bool shouldAnimateExiting(int tag, bool shouldAnimate);
  bool hasLayoutAnimation(int tag, LayoutAnimationType type);
  void startLayoutAnimation(
      jsi::Runtime &rt,
      int tag,
      LayoutAnimationType type,
      const jsi::Object &values);
  void clearLayoutAnimationConfig(int tag);
  void cancelLayoutAnimation(jsi::Runtime &rt, int tag);
  int findPrecedingViewTagForTransition(int tag);
#ifndef NDEBUG
  std::string getScreenSharedTagPairString(
      const int screenTag,
      const std::string &sharedTag) const;
  void checkDuplicateSharedTag(const int viewTag, const int screenTag);
#endif

 private:
  std::unordered_map<int, std::shared_ptr<Shareable>> &getConfigsForType(
      LayoutAnimationType type);

  std::shared_ptr<JSLogger> jsLogger_;
#ifndef NDEBUG
  // This set's function is to detect duplicate sharedTags on a single screen
  // it contains strings in form: "reactScreenTag:sharedTag"
  std::unordered_set<std::string> screenSharedTagSet_;
  // And this map is to remove collected pairs on SET removal
  std::unordered_map<int, std::string> viewsScreenSharedTagMap_;
#endif

  std::unordered_map<int, std::shared_ptr<Shareable>> enteringAnimations_;
  std::unordered_map<int, std::shared_ptr<Shareable>> exitingAnimations_;
  std::unordered_map<int, std::shared_ptr<Shareable>> layoutAnimations_;
  std::unordered_map<int, std::shared_ptr<Shareable>>
      sharedTransitionAnimations_;
  std::unordered_set<int> ignoreProgressAnimationForTag_;
  std::unordered_map<std::string, std::vector<int>> sharedTransitionGroups_;
  std::unordered_map<int, std::string> viewTagToSharedTag_;
  std::unordered_map<int, bool> shouldAnimateExitingForTag_;
  mutable std::mutex
      animationsMutex_; // Protects `enteringAnimations_`, `exitingAnimations_`,
  // `layoutAnimations_`, `viewSharedValues_` and `shouldAnimateExitingForTag_`.
};

} // namespace reanimated
