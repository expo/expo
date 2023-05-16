#ifdef RCT_NEW_ARCH_ENABLED

#include "ReanimatedUIManagerBinding.h"
#include "FabricUtils.h"
#include "NewestShadowNodesRegistry.h"

#include <react/renderer/debug/SystraceSection.h>

#include <utility>

using namespace facebook;
using namespace react;

namespace reanimated {

void ReanimatedUIManagerBinding::createAndInstallIfNeeded(
    jsi::Runtime &runtime,
    RuntimeExecutor const &runtimeExecutor,
    std::shared_ptr<UIManager> const &uiManager,
    std::shared_ptr<NewestShadowNodesRegistry> const
        &newestShadowNodesRegistry) {
  // adapted from UIManagerBinding.cpp
  auto uiManagerModuleName = "nativeFabricUIManager";

  auto eventHandler = [&]() -> std::unique_ptr<EventHandler const> {
    auto uiManagerValue =
        runtime.global().getProperty(runtime, uiManagerModuleName);
    if (uiManagerValue.isUndefined()) {
      return nullptr;
    }

    auto uiManagerBinding =
        uiManagerValue.asObject(runtime).asHostObject<UIManagerBinding>(
            runtime);
    auto uiManagerBindingPublic =
        reinterpret_cast<UIManagerBindingPublic *>(&*uiManagerBinding);
    return std::move(uiManagerBindingPublic->eventHandler_);
  }();

  auto reanimatedUiManagerBinding =
      std::make_shared<ReanimatedUIManagerBinding>(
          uiManager,
          runtimeExecutor,
          std::move(eventHandler),
          newestShadowNodesRegistry);
  auto object =
      jsi::Object::createFromHostObject(runtime, reanimatedUiManagerBinding);
  runtime.global().setProperty(runtime, uiManagerModuleName, std::move(object));
}

ReanimatedUIManagerBinding::ReanimatedUIManagerBinding(
    std::shared_ptr<UIManager> uiManager,
    RuntimeExecutor runtimeExecutor,
    std::unique_ptr<EventHandler const> eventHandler,
    std::shared_ptr<NewestShadowNodesRegistry> newestShadowNodesRegistry)
    : UIManagerBinding(uiManager),
      uiManager_(std::move(uiManager)),
      newestShadowNodesRegistry_(newestShadowNodesRegistry) {
  if (eventHandler != nullptr) {
    reinterpret_cast<UIManagerBindingPublic *>(this)->eventHandler_ =
        std::move(eventHandler);
  }
}

ReanimatedUIManagerBinding::~ReanimatedUIManagerBinding() {}

static inline ShadowNode::Shared cloneNodeUsingNewest(
    UIManager *uiManager,
    NewestShadowNodesRegistry *newestShadowNodesRegistry,
    ShadowNode const &shadowNode,
    ShadowNode::SharedListOfShared const &children = nullptr,
    RawProps const *rawProps = nullptr) {
  {
    auto lock = newestShadowNodesRegistry->createLock();
    auto newest = newestShadowNodesRegistry->get(shadowNode.getTag());
    if (newest != nullptr) {
      // ShadowNode managed by Reanimated, use newest ShadowNode from registry
      auto clone = uiManager->cloneNode(*newest, children, rawProps);
      newestShadowNodesRegistry->update(clone);
      return clone;
    }
  } // release lock since we don't need registry anymore

  // ShadowNode not managed by Reanimated (yet?)
  return uiManager->cloneNode(shadowNode, children, rawProps);
}

static inline void appendChildUsingNewest(
    UIManager *uiManager,
    NewestShadowNodesRegistry *newestShadowNodesRegistry,
    const ShadowNode::Shared &parentShadowNode,
    const ShadowNode::Shared &childShadowNode) {
  {
    auto lock = newestShadowNodesRegistry->createLock();
    auto newestChildShadowNode =
        newestShadowNodesRegistry->get(childShadowNode->getTag());
    if (newestChildShadowNode != nullptr) {
      uiManager->appendChild(parentShadowNode, newestChildShadowNode);
      return;
    }
  } // release lock since we don't need registry anymore

  // child ShadowNode not managed by Reanimated (yet?)
  uiManager->appendChild(parentShadowNode, childShadowNode);
}

jsi::Value ReanimatedUIManagerBinding::get(
    jsi::Runtime &runtime,
    jsi::PropNameID const &name) {
  // Currently, we need to overwrite all variants of `cloneNode` as well as
  // `appendChild` to prevent React from overwriting layout props animated using
  // Reanimated. However, this may degrade performance due to using locks.
  // We already have an idea how this can be done better without locks
  // (i.e. by overwriting `completeRoot` and using UIManagerCommitHooks).

  // based on implementation from UIManagerBinding.cpp
  auto methodName = name.utf8(runtime);
  SystraceSection s("ReanimatedUIManagerBinding::get", "name", methodName);
  UIManager *uiManager = uiManager_.get();
  NewestShadowNodesRegistry *newestShadowNodesRegistry =
      newestShadowNodesRegistry_.get();

  // Semantic: Clones the node with *same* props and *same* children.
  if (methodName == "cloneNode") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [uiManager, newestShadowNodesRegistry](
            jsi::Runtime &runtime,
            jsi::Value const & /*thisValue*/,
            jsi::Value const *arguments,
            size_t /*count*/) noexcept -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              cloneNodeUsingNewest(
                  uiManager,
                  newestShadowNodesRegistry,
                  *shadowNodeFromValue(runtime, arguments[0])));
        });
  }

  // Semantic: Clones the node with *same* props and *empty* children.
  if (methodName == "cloneNodeWithNewChildren") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [uiManager, newestShadowNodesRegistry](
            jsi::Runtime &runtime,
            jsi::Value const & /*thisValue*/,
            jsi::Value const *arguments,
            size_t /*count*/) noexcept -> jsi::Value {
          return valueFromShadowNode(
              runtime,
              cloneNodeUsingNewest(
                  uiManager,
                  newestShadowNodesRegistry,
                  *shadowNodeFromValue(runtime, arguments[0]),
                  ShadowNode::emptySharedShadowNodeSharedList()));
        });
  }

  // Semantic: Clones the node with *given* props and *same* children.
  if (methodName == "cloneNodeWithNewProps") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [uiManager, newestShadowNodesRegistry](
            jsi::Runtime &runtime,
            jsi::Value const & /*thisValue*/,
            jsi::Value const *arguments,
            size_t /*count*/) noexcept -> jsi::Value {
          auto const &rawProps = RawProps(runtime, arguments[1]);
          return valueFromShadowNode(
              runtime,
              cloneNodeUsingNewest(
                  uiManager,
                  newestShadowNodesRegistry,
                  *shadowNodeFromValue(runtime, arguments[0]),
                  nullptr,
                  &rawProps));
        });
  }

  // Semantic: Clones the node with *given* props and *empty* children.
  if (methodName == "cloneNodeWithNewChildrenAndProps") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [uiManager, newestShadowNodesRegistry](
            jsi::Runtime &runtime,
            jsi::Value const & /*thisValue*/,
            jsi::Value const *arguments,
            size_t /*count*/) noexcept -> jsi::Value {
          auto const &rawProps = RawProps(runtime, arguments[1]);
          return valueFromShadowNode(
              runtime,
              cloneNodeUsingNewest(
                  uiManager,
                  newestShadowNodesRegistry,
                  *shadowNodeFromValue(runtime, arguments[0]),
                  ShadowNode::emptySharedShadowNodeSharedList(),
                  &rawProps));
        });
  }

  if (methodName == "appendChild") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [uiManager, newestShadowNodesRegistry](
            jsi::Runtime &runtime,
            jsi::Value const & /*thisValue*/,
            jsi::Value const *arguments,
            size_t /*count*/) noexcept -> jsi::Value {
          appendChildUsingNewest(
              uiManager,
              newestShadowNodesRegistry,
              shadowNodeFromValue(runtime, arguments[0]),
              shadowNodeFromValue(runtime, arguments[1]));
          return jsi::Value::undefined();
        });
  }

  // Methods like "findNodeAtPoint", "getRelativeLayoutMetrics", "measure" etc.
  // use `UIManager::getNewestCloneOfShadowNode` or
  // `ShadowTree::getCurrentRevision` under the hood,
  // so there's no need to overwrite them.

  return UIManagerBinding::get(runtime, name);
}

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
