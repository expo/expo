// Copyright 2015-present 650 Industries. All rights reserved.

// Commits the launch template into a JS-free Fabric surface. Reaches the C++ Scheduler through the
// Java FabricUIManager -> FabricUIManagerBinding -> Scheduler -> UIManager, like Reanimated does.

#include <android/log.h>
#include <fbjni/fbjni.h>

#include <folly/dynamic.h>
#include <folly/json.h>

#include <react/fabric/FabricUIManagerBinding.h>
#include <react/fabric/JFabricUIManager.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/mounting/ShadowTreeRegistry.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/utils/ContextContainer.h>

#define EXPO_PRERENDER_TAG "expo-splash-screen"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, EXPO_PRERENDER_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, EXPO_PRERENDER_TAG, __VA_ARGS__)

using namespace facebook;
using namespace facebook::react;

namespace {

/// JSON `{name, props, children}` -> shadow nodes.
class TemplateBuilder {
 public:
  TemplateBuilder(
      const ComponentDescriptorRegistry& registry,
      const ContextContainer& contextContainer,
      SurfaceId surfaceId)
      : registry_(registry), contextContainer_(contextContainer), surfaceId_(surfaceId) {}

  std::shared_ptr<const ShadowNode> build(const folly::dynamic& node) {
    const auto name = node["name"].asString();
    const auto& descriptor = registry_.at(name);

    auto family = descriptor.createFamily(ShadowNodeFamilyFragment{allocateTag(), surfaceId_, nullptr});

    PropsParserContext parserContext{surfaceId_, contextContainer_};
    folly::dynamic rawPropsDynamic =
        node.count("props") != 0 && node["props"].isObject() ? node["props"] : folly::dynamic::object();
    auto props = descriptor.cloneProps(parserContext, nullptr, RawProps(std::move(rawPropsDynamic)));

    auto mutableChildren = std::vector<std::shared_ptr<const ShadowNode>>{};
    if (node.count("children") != 0 && node["children"].isArray()) {
      for (const auto& child : node["children"]) {
        mutableChildren.push_back(build(child));
      }
    }
    std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>> children =
        std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(std::move(mutableChildren));

    auto state = descriptor.createInitialState(props, family);

    nodeCount_++;
    return descriptor.createShadowNode(
        ShadowNodeFragment{
            .props = props,
            .children = children,
            .state = state,
            .runtimeShadowNodeReference = false,
        },
        family);
  }

  int nodeCount() const { return nodeCount_; }
  void reset() { nodeCount_ = 0; }

 private:
  // Odd tags not ending in 1: never collide with React's even tags or root tags.
  Tag allocateTag() {
    Tag tag = nextTag_;
    nextTag_ += 2;
    if (nextTag_ % 10 == 1) {
      nextTag_ += 2;
    }
    return tag;
  }

  const ComponentDescriptorRegistry& registry_;
  const ContextContainer& contextContainer_;
  SurfaceId surfaceId_;
  Tag nextTag_ = 1000003;
  int nodeCount_ = 0;
};

struct PrerenderNative : jni::JavaClass<PrerenderNative> {
  static constexpr auto kJavaDescriptor = "Lexpo/modules/splashscreen/SplashScreenPrerenderNative;";

  static jint commit(
      jni::alias_ref<jclass>,
      jni::alias_ref<JFabricUIManager::javaobject> fabricUIManager,
      jint surfaceId,
      jni::alias_ref<jstring> templateJson) {
    try {
      auto* binding = fabricUIManager->getBinding();
      if (binding == nullptr) {
        LOGE("FabricUIManager has no binding yet");
        return -1;
      }
      auto scheduler = binding->getScheduler();
      if (!scheduler) {
        LOGE("scheduler not available");
        return -1;
      }
      auto uiManager = scheduler->getUIManager();
      auto contextContainer = scheduler->getContextContainer();
      auto weakRegistry = contextContainer->find<std::weak_ptr<const ComponentDescriptorRegistry>>(
          "ComponentDescriptorRegistry_DO_NOT_USE_PRETTY_PLEASE");
      auto registry = weakRegistry.has_value() ? weakRegistry.value().lock() : nullptr;
      if (!registry) {
        LOGE("component descriptor registry not available");
        return -1;
      }

      folly::dynamic templateDynamic = folly::parseJson(templateJson->toStdString());

      int nodeCount = 0;
      bool committed = false;
      bool found = uiManager->getShadowTreeRegistry().visit(surfaceId, [&](const ShadowTree& shadowTree) {
        TemplateBuilder builder(*registry, *contextContainer, surfaceId);
        auto status = shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode) -> RootShadowNode::Unshared {
              builder.reset();
              auto child = builder.build(templateDynamic);
              auto children = std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(
                  std::vector<std::shared_ptr<const ShadowNode>>{child});
              return std::static_pointer_cast<RootShadowNode>(
                  oldRootShadowNode.ShadowNode::clone(ShadowNodeFragment{.children = children}));
            },
            ShadowTree::CommitOptions{.mountSynchronously = true});
        nodeCount = builder.nodeCount();
        committed = status == ShadowTree::CommitStatus::Succeeded;
      });
      if (!found) {
        LOGE("no shadow tree for surface %d (surface not started?)", surfaceId);
        return -1;
      }
      if (!committed) {
        LOGE("commit did not succeed");
        return -1;
      }
      LOGI("committed %d nodes into surface %d", nodeCount, surfaceId);
      return nodeCount;
    } catch (const std::exception& e) {
      LOGE("failed to build template: %s", e.what());
      return -1;
    }
  }

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("commit", PrerenderNative::commit),
    });
  }
};

} // namespace

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return jni::initialize(vm, [] { PrerenderNative::registerNatives(); });
}
