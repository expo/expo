#pragma once

#include "LayoutAnimationType.h"
#include "Shareables.h"

#ifdef DEBUG
#include "JSLogger.h"
#endif

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
#ifdef DEBUG
  explicit LayoutAnimationsManager(const std::shared_ptr<JSLogger> &jsLogger)
      : jsLogger_(jsLogger) {}
#endif
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
  void cancelLayoutAnimation(jsi::Runtime &rt, int tag);
  int findPrecedingViewTagForTransition(int tag);
#ifdef DEBUG
  std::string getScreenSharedTagPairString(
      const int screenTag,
      const std::string &sharedTag) const;
  void checkDuplicateSharedTag(const int viewTag, const int screenTag);
#endif

 private:
  std::unordered_map<int, std::shared_ptr<Shareable>> &getConfigsForType(
      LayoutAnimationType type);

#ifdef DEBUG
  std::shared_ptr<JSLogger> jsLogger_;
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
  mutable std::mutex
      animationsMutex_; // Protects `enteringAnimations_`, `exitingAnimations_`,
  // `layoutAnimations_` and `viewSharedValues_`.
};

} // namespace reanimated
