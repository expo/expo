// Copyright 2015-present 650 Industries. All rights reserved.

// Lays out and mounts a launch screen snapshot with Fabric before React Native starts, and reads the
// props of the app's shadow tree for the next snapshot.
//
// The prerender owns a shadow tree with a private registry of React Native's core component
// descriptors, and builds View, Paragraph, Text and RawText nodes. Text is measured by the Java `FabricUIManager` given to `prepare`, a standalone instance
// with no binding, and the finished transaction is mounted through `FabricMountingManager` into that
// same `FabricUIManager`. No React instance, JS runtime or TurboModule is involved.

#include <android/log.h>
#include <fbjni/fbjni.h>

#include <folly/dynamic.h>
#include <folly/json.h>

#include <react/fabric/CoreComponentsRegistry.h>
#include <react/fabric/FabricMountingManager.h>
#include <react/fabric/FabricUIManagerBinding.h>
#include <react/fabric/JFabricUIManager.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/utils/ContextContainer.h>

#define TAG "ExpoSplashPrerender"
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN, TAG, __VA_ARGS__)

using namespace facebook;
using namespace facebook::react;

namespace {

/**
 * Builds shadow nodes from a template node `{ "name": "View", "props": {...}, "children": [...] }`.
 * Component names are Fabric names (`View`, `Paragraph`, `Text`, `RawText`).
 */
class TemplateBuilder {
 public:
  TemplateBuilder(const ComponentDescriptorRegistry &registry, const ContextContainer &contextContainer, SurfaceId surfaceId)
      : registry_(registry), contextContainer_(contextContainer), surfaceId_(surfaceId) {}

  std::shared_ptr<const ShadowNode> build(const folly::dynamic &node) {
    const auto &descriptor = registry_.at(node["name"].asString());
    auto family = descriptor.createFamily(ShadowNodeFamilyFragment{allocateTag(), surfaceId_, nullptr});

    PropsParserContext parserContext{surfaceId_, contextContainer_};
    folly::dynamic rawProps =
        node.count("props") != 0 && node["props"].isObject() ? node["props"] : folly::dynamic::object();
    auto props = descriptor.cloneProps(parserContext, nullptr, RawProps(std::move(rawProps)));

    auto mutableChildren = std::vector<std::shared_ptr<const ShadowNode>>{};
    if (node.count("children") != 0 && node["children"].isArray()) {
      for (const auto &child : node["children"]) {
        mutableChildren.push_back(build(child));
      }
    }
    auto children = std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(std::move(mutableChildren));

    auto state = descriptor.createInitialState(props, family);
    return descriptor.createShadowNode(
        ShadowNodeFragment{
            .props = props,
            .children = children,
            .state = state,
            .runtimeShadowNodeReference = false,
        },
        family);
  }

 private:
  // Odd tags not ending in 1 never collide with React's even tags or with root tags.
  Tag allocateTag() {
    Tag tag = nextTag_;
    nextTag_ += 2;
    if (nextTag_ % 10 == 1) {
      nextTag_ += 2;
    }
    return tag;
  }

  const ComponentDescriptorRegistry &registry_;
  const ContextContainer &contextContainer_;
  SurfaceId surfaceId_;
  Tag nextTag_ = 1000003;
};

/**
 * The only thing the UIManager/Scheduler pair contributes to a native commit is handing the finished
 * transaction to the mounting manager, so this delegate does just that, synchronously: the commit
 * runs on the UI thread, and `FabricUIManager` executes a synchronous batch right away.
 */
class MountingTreeDelegate : public ShadowTreeDelegate {
 public:
  explicit MountingTreeDelegate(std::shared_ptr<FabricMountingManager> mountingManager)
      : mountingManager_(std::move(mountingManager)) {}

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree &,
      const RootShadowNode::Shared &,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTreeCommitOptions &) const override {
    return newRootShadowNode;
  }

  void shadowTreeDidFinishTransaction(std::shared_ptr<const MountingCoordinator> mountingCoordinator, bool) const override {
    auto transaction = mountingCoordinator->pullTransaction();
    if (transaction.has_value()) {
      mountingManager_->executeMount(*transaction, /* synchronous */ true);
    }
  }

  void shadowTreeDidFinishReactCommit(const ShadowTree &) const override {}

 private:
  std::shared_ptr<FabricMountingManager> mountingManager_;
};

/** Everything the prerender keeps alive between `prepare` and `release`. */
struct Prerender {
  jni::global_ref<JFabricUIManager::javaobject> fabricUIManager;
  std::shared_ptr<ContextContainer> contextContainer;
  std::shared_ptr<const ComponentDescriptorProviderRegistry> providerRegistry;
  std::shared_ptr<const ComponentDescriptorRegistry> registry;
  std::shared_ptr<FabricMountingManager> mountingManager;
  std::unique_ptr<MountingTreeDelegate> treeDelegate;
  std::unique_ptr<ShadowTree> tree;
  RootShadowNode::Unshared preparedRoot;
};

// region Capture

const char *componentNameOf(const ShadowNode &node) {
  return node.getComponentName();
}

/** `Text` and `RawText` children of a paragraph, with every prop that differs from the default. */
folly::dynamic serializeTextChildren(const ShadowNode &node) {
  folly::dynamic children = folly::dynamic::array();
  for (const auto &child : node.getChildren()) {
    std::string name = componentNameOf(*child);
    if (name != "Text" && name != "RawText") {
      // Inline views are left out.
      continue;
    }
    children.push_back(
        folly::dynamic::object("name", name)("props", child->getProps()->getDiffProps(nullptr))(
            "children", serializeTextChildren(*child)));
  }
  return children;
}

/**
 * The props of every View and Paragraph node in the app's shadow trees, keyed by tag:
 * `{ "<tag>": { "name", "props", "padding": [l, t, r, b], "children" } }`. Props are the typed
 * props as React set them, as `getDiffProps` against the defaults returns them. Paragraphs carry their
 * text children and their content insets (padding plus border) from the layout.
 */
void collectNodes(const ShadowNode &node, folly::dynamic &out) {
  std::string name = componentNameOf(node);
  if (name == "View" || name == "Paragraph") {
    folly::dynamic entry = folly::dynamic::object("name", name)("props", node.getProps()->getDiffProps(nullptr));
    if (name == "Paragraph") {
      // A paragraph is a Yoga node. `dynamic_cast` is avoided: the type info of nodes created in
      // `libreactnative.so` is not this library's.
      const auto &metrics = static_cast<const LayoutableShadowNode &>(node).getLayoutMetrics();
      auto inner = metrics.contentInsets - metrics.borderWidth;
      entry["padding"] = folly::dynamic::array(inner.left, inner.top, inner.right, inner.bottom);
      entry["children"] = serializeTextChildren(node);
    }
    out[std::to_string(node.getTag())] = std::move(entry);
  }
  if (name == "Paragraph") {
    return;
  }
  for (const auto &child : node.getChildren()) {
    collectNodes(*child, out);
  }
}

// endregion

struct PrerenderNative : jni::JavaClass<PrerenderNative> {
  static constexpr auto kJavaDescriptor = "Lexpo/modules/splashscreen/SplashScreenPrerenderNative;";

  /**
   * Any thread but the UI thread. Builds the template and lays it out. Returns a handle for `mount`
   * and `release`, or 0.
   */
  static jlong prepare(
      jni::alias_ref<jclass>,
      jni::alias_ref<JFabricUIManager::javaobject> fabricUIManager,
      jint surfaceId,
      jni::alias_ref<jstring> templateJson,
      jfloat width,
      jfloat height,
      jfloat pointScaleFactor,
      jboolean rightToLeft) {
    auto prerender = std::make_unique<Prerender>();
    try {
      prerender->fabricUIManager = jni::make_global(fabricUIManager);
      auto contextContainer = std::make_shared<ContextContainer>();
      // The text layout manager measures text through this object.
      contextContainer->insert("FabricUIManager", jni::alias_ref<jobject>(prerender->fabricUIManager));
      prerender->contextContainer = contextContainer;

      prerender->mountingManager = std::make_shared<FabricMountingManager>(prerender->fabricUIManager);
      prerender->mountingManager->onSurfaceStart(surfaceId);
      prerender->treeDelegate = std::make_unique<MountingTreeDelegate>(prerender->mountingManager);

      LayoutConstraints layoutConstraints{
          .minimumSize = {.width = width, .height = height},
          .maximumSize = {.width = width, .height = height},
          .layoutDirection = rightToLeft ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight};
      LayoutContext layoutContext{};
      layoutContext.pointScaleFactor = pointScaleFactor;
      layoutContext.viewportSize = {.width = width, .height = height};
      prerender->tree = std::make_unique<ShadowTree>(
          surfaceId, layoutConstraints, layoutContext, *prerender->treeDelegate, *contextContainer);

      // A private registry, with the descriptors of React Native's core components. They must be
      // instantiated in `libreactnative.so`: the text layout tells raw text from attachments with
      // `dynamic_cast`, and shadow nodes instantiated in this library would have this library's
      // type info. The template has View, Paragraph, Text and RawText nodes only; the views come from
      // the view managers that the given `FabricUIManager` was created with.
      auto providerRegistry = std::make_shared<ComponentDescriptorProviderRegistry>();
      CoreComponentsRegistry::addCoreComponents(providerRegistry);
      prerender->providerRegistry = providerRegistry;
      prerender->registry = providerRegistry->createComponentDescriptorRegistry(ComponentDescriptorParameters{
          .eventDispatcher = EventDispatcher::Shared{}, .contextContainer = contextContainer, .flavor = nullptr});

      folly::dynamic templateDynamic = folly::parseJson(templateJson->toStdString());
      TemplateBuilder builder(*prerender->registry, *contextContainer, surfaceId);
      auto child = builder.build(templateDynamic);
      auto children = std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(
          std::vector<std::shared_ptr<const ShadowNode>>{child});
      const auto &currentRoot = *prerender->tree->getCurrentRevision().rootShadowNode;
      auto newRoot = std::static_pointer_cast<RootShadowNode>(
          currentRoot.ShadowNode::clone(ShadowNodeFragment{.children = children}));
      std::vector<const LayoutableShadowNode *> affected;
      newRoot->layoutIfNeeded(&affected);
      prerender->preparedRoot = newRoot;
    } catch (const std::exception &e) {
      LOGW("failed to build the snapshot: %s", e.what());
      return 0;
    }
    return reinterpret_cast<jlong>(prerender.release());
  }

  /** UI thread, after the surface has started on the Java side. Commits and mounts the prepared tree. */
  static jboolean mount(jni::alias_ref<jclass>, jlong handle) {
    auto *prerender = reinterpret_cast<Prerender *>(handle);
    if (prerender == nullptr || !prerender->preparedRoot) {
      return false;
    }
    RootShadowNode::Unshared preparedRoot = prerender->preparedRoot;
    prerender->preparedRoot = nullptr;
    try {
      auto status = prerender->tree->commit(
          [&](const RootShadowNode &) -> RootShadowNode::Unshared { return preparedRoot; },
          ShadowTree::CommitOptions{.mountSynchronously = true});
      return status == ShadowTree::CommitStatus::Succeeded;
    } catch (const std::exception &e) {
      LOGW("failed to mount the snapshot: %s", e.what());
      return false;
    }
  }

  static void release(jni::alias_ref<jclass>, jlong handle, jint surfaceId) {
    auto *prerender = reinterpret_cast<Prerender *>(handle);
    if (prerender == nullptr) {
      return;
    }
    if (prerender->mountingManager) {
      prerender->mountingManager->onSurfaceStop(surfaceId);
    }
    delete prerender;
  }

  /** UI thread. The props of the app's shadow trees, as JSON (see `collectNodes`), or null. */
  static jni::local_ref<jstring> captureProps(jni::alias_ref<jclass>, jni::alias_ref<JFabricUIManager::javaobject> fabricUIManager) {
    try {
      auto *binding = fabricUIManager->getBinding();
      auto scheduler = binding != nullptr ? binding->getScheduler() : nullptr;
      if (!scheduler) {
        return nullptr;
      }
      folly::dynamic nodes = folly::dynamic::object();
      scheduler->getUIManager()->getShadowTreeRegistry().enumerate([&](const ShadowTree &shadowTree, bool &) {
        collectNodes(*shadowTree.getCurrentRevision().rootShadowNode, nodes);
      });
      return jni::make_jstring(folly::toJson(nodes));
    } catch (const std::exception &e) {
      LOGW("failed to read the shadow tree: %s", e.what());
      return nullptr;
    }
  }

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("prepare", PrerenderNative::prepare),
        makeNativeMethod("mount", PrerenderNative::mount),
        makeNativeMethod("release", PrerenderNative::release),
        makeNativeMethod("captureProps", PrerenderNative::captureProps),
    });
  }
};

} // namespace

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return jni::initialize(vm, [] { PrerenderNative::registerNatives(); });
}
