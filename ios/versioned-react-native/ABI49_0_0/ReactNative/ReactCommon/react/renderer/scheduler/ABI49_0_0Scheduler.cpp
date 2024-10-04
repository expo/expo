/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0Scheduler.h"

#include <glog/logging.h>
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include <ABI49_0_0React/debug/ABI49_0_0React_native_assert.h>
#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorRegistry.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventQueueProcessor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutContext.h>
#include <ABI49_0_0React/renderer/debug/ABI49_0_0SystraceSection.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0MountingOverrideDelegate.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowViewMutation.h>
#include <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeScheduler.h>
#include <ABI49_0_0React/renderer/templateprocessor/ABI49_0_0UITemplateProcessor.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0UIManager.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0UIManagerBinding.h>

#ifdef ABI49_0_0RN_SHADOW_TREE_INTROSPECTION
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0stubs.h>
#include <iostream>
#endif

namespace ABI49_0_0facebook::ABI49_0_0React {

Scheduler::Scheduler(
    SchedulerToolbox const &schedulerToolbox,
    UIManagerAnimationDelegate *animationDelegate,
    SchedulerDelegate *delegate) {
  runtimeExecutor_ = schedulerToolbox.runtimeExecutor;
  contextContainer_ = schedulerToolbox.contextContainer;

  ABI49_0_0ReactNativeConfig_ =
      contextContainer_->at<std::shared_ptr<const ABI49_0_0ReactNativeConfig>>(
          "ABI49_0_0ReactNativeConfig");

  // Creating a container for future `EventDispatcher` instance.
  eventDispatcher_ = std::make_shared<std::optional<EventDispatcher const>>();

  auto uiManager = std::make_shared<UIManager>(
      runtimeExecutor_, schedulerToolbox.backgroundExecutor, contextContainer_);
  auto eventOwnerBox = std::make_shared<EventBeat::OwnerBox>();
  eventOwnerBox->owner = eventDispatcher_;

  auto weakRuntimeScheduler =
      contextContainer_->find<std::weak_ptr<RuntimeScheduler>>(
          "RuntimeScheduler");
  auto runtimeScheduler = weakRuntimeScheduler.has_value()
      ? weakRuntimeScheduler.value().lock()
      : nullptr;

  auto eventPipe = [uiManager, runtimeScheduler = runtimeScheduler.get()](
                       jsi::Runtime &runtime,
                       const EventTarget *eventTarget,
                       const std::string &type,
                       ABI49_0_0ReactEventPriority priority,
                       const ValueFactory &payloadFactory) {
    uiManager->visitBinding(
        [&](UIManagerBinding const &uiManagerBinding) {
          uiManagerBinding.dispatchEvent(
              runtime, eventTarget, type, priority, payloadFactory);
        },
        runtime);
    if (runtimeScheduler != nullptr) {
      runtimeScheduler->callExpiredTasks(runtime);
    }
  };

  auto statePipe = [uiManager](StateUpdate const &stateUpdate) {
    uiManager->updateState(stateUpdate);
  };

  // Creating an `EventDispatcher` instance inside the already allocated
  // container (inside the optional).
  eventDispatcher_->emplace(
      EventQueueProcessor(eventPipe, statePipe),
      schedulerToolbox.synchronousEventBeatFactory,
      schedulerToolbox.asynchronousEventBeatFactory,
      eventOwnerBox);

  // Casting to `std::shared_ptr<EventDispatcher const>`.
  auto eventDispatcher =
      EventDispatcher::Shared{eventDispatcher_, &eventDispatcher_->value()};

  componentDescriptorRegistry_ = schedulerToolbox.componentRegistryFactory(
      eventDispatcher, contextContainer_);

  uiManager->setDelegate(this);
  uiManager->setComponentDescriptorRegistry(componentDescriptorRegistry_);

  auto bindingsExecutor =
      schedulerToolbox.bridgelessBindingsExecutor.has_value()
      ? schedulerToolbox.bridgelessBindingsExecutor.value()
      : runtimeExecutor_;
  bindingsExecutor([uiManager](jsi::Runtime &runtime) {
    UIManagerBinding::createAndInstallIfNeeded(runtime, uiManager);
  });

  auto componentDescriptorRegistryKey =
      "ComponentDescriptorRegistry_DO_NOT_USE_PRETTY_PLEASE";
  contextContainer_->erase(componentDescriptorRegistryKey);
  contextContainer_->insert(
      componentDescriptorRegistryKey,
      std::weak_ptr<ComponentDescriptorRegistry const>(
          componentDescriptorRegistry_));

  delegate_ = delegate;
  commitHooks_ = schedulerToolbox.commitHooks;
  uiManager_ = uiManager;

  for (auto const &commitHook : commitHooks_) {
    uiManager->registerCommitHook(*commitHook);
  }

#ifdef ANDROID
  removeOutstandingSurfacesOnDestruction_ = true;
  reduceDeleteCreateMutationLayoutAnimation_ = ABI49_0_0ReactNativeConfig_->getBool(
      "ABI49_0_0React_fabric:reduce_delete_create_mutation_layout_animation_android");
#else
  removeOutstandingSurfacesOnDestruction_ = ABI49_0_0ReactNativeConfig_->getBool(
      "ABI49_0_0React_fabric:remove_outstanding_surfaces_on_destruction_ios");
  reduceDeleteCreateMutationLayoutAnimation_ = true;
#endif

  CoreFeatures::blockPaintForUseLayoutEffect = ABI49_0_0ReactNativeConfig_->getBool(
      "ABI49_0_0React_fabric:block_paint_for_use_layout_effect");

  if (animationDelegate != nullptr) {
    animationDelegate->setComponentDescriptorRegistry(
        componentDescriptorRegistry_);
    animationDelegate->setReduceDeleteCreateMutation(
        reduceDeleteCreateMutationLayoutAnimation_);
  }
  uiManager_->setAnimationDelegate(animationDelegate);
}

Scheduler::~Scheduler() {
  LOG(WARNING) << "Scheduler::~Scheduler() was called (address: " << this
               << ").";

  for (auto const &commitHook : commitHooks_) {
    uiManager_->unregisterCommitHook(*commitHook);
  }

  // All Surfaces must be explicitly stopped before destroying `Scheduler`.
  // The idea is that `UIManager` is allowed to call `Scheduler` only if the
  // corresponding `ShadowTree` instance exists.

  // The thread-safety of this operation is guaranteed by this requirement.
  uiManager_->setDelegate(nullptr);
  uiManager_->setAnimationDelegate(nullptr);

  // Then, let's verify that the requirement was satisfied.
  auto surfaceIds = std::vector<SurfaceId>{};
  uiManager_->getShadowTreeRegistry().enumerate(
      [&surfaceIds](ShadowTree const &shadowTree, bool &) {
        surfaceIds.push_back(shadowTree.getSurfaceId());
      });

  // TODO(T88046056): Fix Android memory leak before uncommenting changes
  //  ABI49_0_0React_native_assert(
  //      surfaceIds.empty() &&
  //      "Scheduler was destroyed with outstanding Surfaces.");

  if (surfaceIds.empty()) {
    return;
  }

  LOG(ERROR) << "Scheduler was destroyed with outstanding Surfaces.";

  // If we are here, that means assert didn't fire which indicates that we in
  // production.

  // Now we have still-running surfaces, which is no good, no good.
  // That's indeed a sign of a severe issue on the application layer.
  // At this point, we don't have much to lose, so we are trying to unmount all
  // outstanding `ShadowTree`s to prevent all stored JSI entities from
  // overliving the `Scheduler`. (Unmounting `ShadowNode`s disables
  // `EventEmitter`s which destroys JSI objects.)
  for (auto surfaceId : surfaceIds) {
    uiManager_->getShadowTreeRegistry().visit(
        surfaceId,
        [](ShadowTree const &shadowTree) { shadowTree.commitEmptyTree(); });

    // Removing surfaces is gated because it acquires mutex waiting for commits
    // in flight; in theory, it can deadlock.
    if (removeOutstandingSurfacesOnDestruction_) {
      uiManager_->getShadowTreeRegistry().remove(surfaceId);
    }
  }
}

void Scheduler::registerSurface(
    SurfaceHandler const &surfaceHandler) const noexcept {
  surfaceHandler.setContextContainer(getContextContainer());
  surfaceHandler.setUIManager(uiManager_.get());
}

InspectorData Scheduler::getInspectorDataForInstance(
    EventEmitter const &eventEmitter) const noexcept {
  return executeSynchronouslyOnSameThread_CAN_DEADLOCK<InspectorData>(
      runtimeExecutor_, [=](jsi::Runtime &runtime) -> InspectorData {
        auto uiManagerBinding = UIManagerBinding::getBinding(runtime);
        auto value = uiManagerBinding->getInspectorDataForInstance(
            runtime, eventEmitter);

        // TODO T97216348: avoid transforming jsi into folly::dynamic
        auto dynamic = jsi::dynamicFromValue(runtime, value);
        auto source = dynamic["source"];

        InspectorData result = {};
        result.fileName =
            source["fileName"].isNull() ? "" : source["fileName"].c_str();
        result.lineNumber = (int)source["lineNumber"].getDouble();
        result.columnNumber = (int)source["columnNumber"].getDouble();
        result.selectedIndex = (int)dynamic["selectedIndex"].getDouble();
        // TODO T97216348: remove folly::dynamic from InspectorData struct
        result.props = dynamic["props"];
        auto hierarchy = dynamic["hierarchy"];
        for (auto &i : hierarchy) {
          auto viewHierarchyValue = i["name"];
          if (!viewHierarchyValue.isNull()) {
            result.hierarchy.emplace_back(viewHierarchyValue.c_str());
          }
        }
        return result;
      });
}

void Scheduler::unregisterSurface(
    SurfaceHandler const &surfaceHandler) const noexcept {
  surfaceHandler.setUIManager(nullptr);
}

void Scheduler::renderTemplateToSurface(
    SurfaceId surfaceId,
    const std::string &uiTemplate) {
  SystraceSection s("Scheduler::renderTemplateToSurface");
  try {
    if (uiTemplate.empty()) {
      return;
    }
    NativeModuleRegistry nMR;
    auto tree = UITemplateProcessor::buildShadowTree(
        uiTemplate,
        surfaceId,
        folly::dynamic::object(),
        *componentDescriptorRegistry_,
        nMR,
        ABI49_0_0ReactNativeConfig_);

    uiManager_->getShadowTreeRegistry().visit(
        surfaceId, [=](const ShadowTree &shadowTree) {
          return shadowTree.tryCommit(
              [&](RootShadowNode const &oldRootShadowNode) {
                return std::make_shared<RootShadowNode>(
                    oldRootShadowNode,
                    ShadowNodeFragment{
                        /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                        /* .children = */
                        std::make_shared<ShadowNode::ListOfShared>(
                            ShadowNode::ListOfShared{tree}),
                    });
              },
              {/* default commit options */});
        });
  } catch (const std::exception &e) {
    LOG(ERROR) << "    >>>> ABI49_0_0EXCEPTION <<<  rendering uiTemplate in "
               << "Scheduler::renderTemplateToSurface: " << e.what();
  }
}

ComponentDescriptor const *
Scheduler::findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
    ComponentHandle handle) const {
  return componentDescriptorRegistry_
      ->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(handle);
}

#pragma mark - Delegate

void Scheduler::setDelegate(SchedulerDelegate *delegate) {
  delegate_ = delegate;
}

SchedulerDelegate *Scheduler::getDelegate() const {
  return delegate_;
}

#pragma mark - UIManagerAnimationDelegate

void Scheduler::animationTick() const {
  uiManager_->animationTick();
}

#pragma mark - UIManagerDelegate

void Scheduler::uiManagerDidFinishTransaction(
    MountingCoordinator::Shared mountingCoordinator,
    bool mountSynchronously) {
  SystraceSection s("Scheduler::uiManagerDidFinishTransaction");

  if (delegate_ != nullptr) {
    if (CoreFeatures::blockPaintForUseLayoutEffect) {
      auto weakRuntimeScheduler =
          contextContainer_->find<std::weak_ptr<RuntimeScheduler>>(
              "RuntimeScheduler");
      auto runtimeScheduler = weakRuntimeScheduler.has_value()
          ? weakRuntimeScheduler.value().lock()
          : nullptr;
      if (runtimeScheduler && !mountSynchronously) {
        runtimeScheduler->scheduleTask(
            SchedulerPriority::UserBlockingPriority,
            [delegate = delegate_,
             mountingCoordinator =
                 std::move(mountingCoordinator)](jsi::Runtime &) {
              delegate->schedulerDidFinishTransaction(
                  std::move(mountingCoordinator));
            });
      } else {
        delegate_->schedulerDidFinishTransaction(
            std::move(mountingCoordinator));
      }
    } else {
      delegate_->schedulerDidFinishTransaction(std::move(mountingCoordinator));
    }
  }
}
void Scheduler::uiManagerDidCreateShadowNode(const ShadowNode &shadowNode) {
  SystraceSection s("Scheduler::uiManagerDidCreateShadowNode");

  if (delegate_ != nullptr) {
    delegate_->schedulerDidRequestPreliminaryViewAllocation(
        shadowNode.getSurfaceId(), shadowNode);
  }
}

void Scheduler::uiManagerDidDispatchCommand(
    const ShadowNode::Shared &shadowNode,
    std::string const &commandName,
    folly::dynamic const &args) {
  SystraceSection s("Scheduler::uiManagerDispatchCommand");

  if (delegate_ != nullptr) {
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidDispatchCommand(shadowView, commandName, args);
  }
}

void Scheduler::uiManagerDidSendAccessibilityEvent(
    const ShadowNode::Shared &shadowNode,
    std::string const &eventType) {
  SystraceSection s("Scheduler::uiManagerDidSendAccessibilityEvent");

  if (delegate_ != nullptr) {
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidSendAccessibilityEvent(shadowView, eventType);
  }
}

/*
 * Set JS responder for a view.
 */
void Scheduler::uiManagerDidSetIsJSResponder(
    ShadowNode::Shared const &shadowNode,
    bool isJSResponder,
    bool blockNativeResponder) {
  if (delegate_ != nullptr) {
    delegate_->schedulerDidSetIsJSResponder(
        ShadowView(*shadowNode), isJSResponder, blockNativeResponder);
  }
}

ContextContainer::Shared Scheduler::getContextContainer() const {
  return contextContainer_;
}

std::shared_ptr<UIManager> Scheduler::getUIManager() const {
  return uiManager_;
}

void Scheduler::addEventListener(
    const std::shared_ptr<EventListener const> &listener) {
  if (eventDispatcher_->has_value()) {
    eventDispatcher_->value().addListener(listener);
  }
}

void Scheduler::removeEventListener(
    const std::shared_ptr<EventListener const> &listener) {
  if (eventDispatcher_->has_value()) {
    eventDispatcher_->value().removeListener(listener);
  }
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
