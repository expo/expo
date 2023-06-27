#include "LayoutAnimationsManager.h"
#include "CollectionUtils.h"
#include "Shareables.h"

#include <utility>

namespace reanimated {

void LayoutAnimationsManager::configureAnimation(
    int tag,
    LayoutAnimationType type,
    const std::string &sharedTransitionTag,
    std::shared_ptr<Shareable> config) {
  auto lock = std::unique_lock<std::mutex>(animationsMutex_);
  getConfigsForType(type)[tag] = config;
  if (type == SHARED_ELEMENT_TRANSITION) {
    sharedTransitionGroups_[sharedTransitionTag].push_back(tag);
    viewTagToSharedTag_[tag] = sharedTransitionTag;
  }
}

bool LayoutAnimationsManager::hasLayoutAnimation(
    int tag,
    LayoutAnimationType type) {
  auto lock = std::unique_lock<std::mutex>(animationsMutex_);
  return collection::contains(getConfigsForType(type), tag);
}

void LayoutAnimationsManager::clearLayoutAnimationConfig(int tag) {
  auto lock = std::unique_lock<std::mutex>(animationsMutex_);
  enteringAnimations_.erase(tag);
  exitingAnimations_.erase(tag);
  layoutAnimations_.erase(tag);

  sharedTransitionAnimations_.erase(tag);
  auto const &groupName = viewTagToSharedTag_[tag];
  auto &group = sharedTransitionGroups_[groupName];
  auto position = std::find(group.begin(), group.end(), tag);
  if (position != group.end()) {
    group.erase(position);
  }
  if (group.size() == 0) {
    sharedTransitionGroups_.erase(groupName);
  }
  viewTagToSharedTag_.erase(tag);
}

void LayoutAnimationsManager::startLayoutAnimation(
    jsi::Runtime &rt,
    int tag,
    LayoutAnimationType type,
    const jsi::Object &values) {
  std::shared_ptr<Shareable> config, viewShareable;
  {
    auto lock = std::unique_lock<std::mutex>(animationsMutex_);
    config = getConfigsForType(type)[tag];
  }
  // TODO: cache the following!!
  jsi::Value layoutAnimationRepositoryAsValue =
      rt.global()
          .getPropertyAsObject(rt, "global")
          .getProperty(rt, "LayoutAnimationsManager");
  jsi::Function startAnimationForTag =
      layoutAnimationRepositoryAsValue.getObject(rt).getPropertyAsFunction(
          rt, "start");
  startAnimationForTag.call(
      rt,
      jsi::Value(tag),
      jsi::Value(static_cast<int>(type)),
      values,
      config->getJSValue(rt));
}

void LayoutAnimationsManager::cancelLayoutAnimation(
    jsi::Runtime &rt,
    int tag,
    LayoutAnimationType type,
    bool cancelled = true,
    bool removeView = true) {
  jsi::Value layoutAnimationRepositoryAsValue =
      rt.global()
          .getPropertyAsObject(rt, "global")
          .getProperty(rt, "LayoutAnimationsManager");
  jsi::Function cancelLayoutAnimation =
      layoutAnimationRepositoryAsValue.getObject(rt).getPropertyAsFunction(
          rt, "stop");
  std::shared_ptr<Shareable> config;
  {
    auto lock = std::unique_lock<std::mutex>(animationsMutex_);
    config = sharedTransitionAnimations_[tag];
  }
  if (config != nullptr) {
    cancelLayoutAnimation.call(
        rt, jsi::Value(tag), config->getJSValue(rt), cancelled, removeView);
  }
}

/*
  The top screen on the stack triggers the animation, so we need to find
  the sibling view registered in the past. This method finds view
  registered in the same transition group (with the same transition tag)
  which has been added to that group directly before the one that we
  provide as an argument.
*/
int LayoutAnimationsManager::findPrecedingViewTagForTransition(int tag) {
  auto const &groupName = viewTagToSharedTag_[tag];
  auto const &group = sharedTransitionGroups_[groupName];
  auto position = std::find(group.begin(), group.end(), tag);
  if (position != group.end() && position != group.begin()) {
    return *std::prev(position);
  }
  return -1;
}

std::unordered_map<int, std::shared_ptr<Shareable>>
    &LayoutAnimationsManager::getConfigsForType(LayoutAnimationType type) {
  switch (type) {
    case ENTERING:
      return enteringAnimations_;
    case EXITING:
      return exitingAnimations_;
    case LAYOUT:
      return layoutAnimations_;
    case SHARED_ELEMENT_TRANSITION:
      return sharedTransitionAnimations_;
    default:
      assert(false);
  }
}

} // namespace reanimated
