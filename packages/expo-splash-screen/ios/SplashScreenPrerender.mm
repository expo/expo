// Copyright 2015-present 650 Industries. All rights reserved.

#import "SplashScreenPrerender.h"

#import <objc/message.h>

#import <React/RCTComponentViewFactory.h>
#import <React/RCTMountingManager.h>
#import <React/RCTParagraphComponentView.h>
#import <React/RCTSafeAreaViewComponentView.h>
#import <React/RCTScrollViewComponentView.h>
#import <React/RCTViewComponentView.h>
#import <React/RCTUtils.h>

#import <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#import <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#import <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#import <react/renderer/components/text/RawTextComponentDescriptor.h>
#import <react/renderer/components/text/TextComponentDescriptor.h>
#import <react/renderer/components/root/RootShadowNode.h>
#import <react/renderer/core/ComponentDescriptor.h>
#import <react/renderer/core/LayoutConstraints.h>
#import <react/renderer/core/LayoutContext.h>
#import <react/renderer/core/PropsParserContext.h>
#import <react/renderer/core/RawProps.h>
#import <react/renderer/core/ShadowNodeFamily.h>
#import <react/renderer/core/ShadowNodeFragment.h>
#import <react/renderer/mounting/MountingCoordinator.h>
#import <react/renderer/mounting/ShadowTree.h>
#import <react/renderer/mounting/ShadowTreeDelegate.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/FollyConvert.h>

#import <folly/dynamic.h>

using namespace facebook::react;

#import <sys/sysctl.h>
#import <unistd.h>

namespace {

NSString *const kTemplateResourceName = @"SplashScreenPrerender";

/// Wall-clock process start time in seconds since the Unix epoch, from the kernel.
double processStartTime()
{
  struct kinfo_proc info;
  size_t size = sizeof(info);
  int mib[4] = {CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()};
  if (sysctl(mib, 4, &info, &size, NULL, 0) != 0) {
    return [[NSDate date] timeIntervalSince1970];
  }
  return (double)info.kp_proc.p_un.__p_starttime.tv_sec + (double)info.kp_proc.p_un.__p_starttime.tv_usec / 1e6;
}
// Root tags end in 1; this one is far above anything React allocates.
const SurfaceId kSurfaceId = 900001;

/**
 Builds shadow nodes from a template node `{ "name": "View", "props": {...}, "children": [...] }`.
 Component names are Fabric names (`View`, `Paragraph`, `RawText`, `Image`, ...).
 */
class TemplateBuilder {
 public:
  TemplateBuilder(const ComponentDescriptorRegistry &registry, const ContextContainer &contextContainer)
      : registry_(registry), contextContainer_(contextContainer)
  {
  }

  std::shared_ptr<const ShadowNode> build(const folly::dynamic &node)
  {
    const auto &descriptor = registry_.at(node["name"].asString());
    auto family = descriptor.createFamily(ShadowNodeFamilyFragment{allocateTag(), kSurfaceId, nullptr});

    PropsParserContext parserContext{kSurfaceId, contextContainer_};
    folly::dynamic rawProps = node.count("props") != 0 && node["props"].isObject() ? node["props"] : folly::dynamic::object();
    auto props = descriptor.cloneProps(parserContext, nullptr, RawProps(std::move(rawProps)));

    auto mutableChildren = std::vector<std::shared_ptr<const ShadowNode>>{};
    if (node.count("children") != 0 && node["children"].isArray()) {
      for (const auto &child : node["children"]) {
        mutableChildren.push_back(build(child));
      }
    }
    std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>> children =
        std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(std::move(mutableChildren));

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
  Tag allocateTag()
  {
    Tag tag = nextTag_;
    nextTag_ += 2;
    if (nextTag_ % 10 == 1) {
      nextTag_ += 2;
    }
    return tag;
  }

  const ComponentDescriptorRegistry &registry_;
  const ContextContainer &contextContainer_;
  Tag nextTag_ = 1000003;
};

/**
 The only thing the UIManager/Scheduler pair contributes to a native commit is handing the
 finished transaction to the mounting manager, so this delegate does just that.
 */
class MountingTreeDelegate : public ShadowTreeDelegate {
 public:
  explicit MountingTreeDelegate(RCTMountingManager *mountingManager) : mountingManager_(mountingManager) {}

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree &,
      const RootShadowNode::Shared &,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTreeCommitOptions &) const override
  {
    return newRootShadowNode;
  }

  void shadowTreeDidFinishTransaction(std::shared_ptr<const MountingCoordinator> mountingCoordinator, bool) const override
  {
    [mountingManager_ scheduleTransaction:std::move(mountingCoordinator)];
  }

  void shadowTreeDidFinishReactCommit(const ShadowTree &) const override {}
  void shadowTreeDidPromoteReactRevision(const ShadowTree &) const override {}

 private:
  RCTMountingManager *mountingManager_;
};

} // namespace

@implementation SplashScreenPrerender {
  dispatch_group_t _prepared;
  CGRect _bounds;
  std::shared_ptr<const ContextContainer> _contextContainer;
  std::shared_ptr<ComponentDescriptorProviderRegistry> _providerRegistry;
  std::shared_ptr<const ComponentDescriptorRegistry> _registry;
  RCTMountingManager *_mountingManager;
  std::unique_ptr<MountingTreeDelegate> _treeDelegate;
  std::unique_ptr<ShadowTree> _tree;
  RootShadowNode::Unshared _preparedRoot;
  UIView *_containerView;
  UIWindow *_window;
  NSTimeInterval _processStart;
}

+ (instancetype)shared
{
  static SplashScreenPrerender *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [SplashScreenPrerender new];
  });
  return instance;
}

+ (void)load
{
  SplashScreenPrerender *prerender = [self shared];
  if (prerender.isEnabled) {
    [prerender log:@"+load"];
    [prerender prepare];
  }
}

- (instancetype)init
{
  if (self = [super init]) {
    // `-ExpoSplashScreenPrerenderDisabled 1` as a launch argument turns the prerender off for A/B runs.
    BOOL disabled = [[NSUserDefaults standardUserDefaults] boolForKey:@"ExpoSplashScreenPrerenderDisabled"];
    _isEnabled = !disabled && [[NSBundle mainBundle] URLForResource:kTemplateResourceName withExtension:@"json"] != nil &&
        !RCTRunningInAppExtension();
    _processStart = [[NSProcessInfo processInfo] systemUptime] - ([[NSDate date] timeIntervalSince1970] - processStartTime());
  }
  return self;
}

- (void)log:(NSString *)stage
{
  if (![[NSUserDefaults standardUserDefaults] boolForKey:@"ExpoSplashScreenPrerenderLog"]) {
    return;
  }
  NSLog(@"[expo-splash-screen] prerender %@ at %.1f ms since process start", stage,
        ([[NSProcessInfo processInfo] systemUptime] - _processStart) * 1000.0);
}

#pragma mark - Preparation (background)

/**
 React Native's feature flags can be overridden once and must not be read before that.
 `RCTReactNativeFactory` overrides them in its init, inside `didFinishLaunching`, and the renderer
 reads them everywhere. Running the factory's one-time setup here, with the release level it would
 use, lets the renderer run before the factory exists; the factory's later call is then a no-op.
 */
- (BOOL)setUpFeatureFlagsEarly
{
  Class factoryClass = NSClassFromString(@"RCTReactNativeFactory");
  SEL selector = NSSelectorFromString(@"_setUpFeatureFlags:");
  if (!factoryClass || ![factoryClass instancesRespondToSelector:selector]) {
    return NO;
  }
  NSString *level = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"ReactNativeReleaseLevel"] lowercaseString];
  NSInteger releaseLevel = [level isEqualToString:@"canary"] ? 0 : [level isEqualToString:@"experimental"] ? 1 : 2;
  ((void (*)(id, SEL, NSInteger))objc_msgSend)([factoryClass alloc], selector, releaseLevel);
  return YES;
}

- (void)prepare
{
  if (_prepared || ![self setUpFeatureFlagsEarly]) {
    return;
  }
  _prepared = dispatch_group_create();
  dispatch_group_enter(_prepared);
  _bounds = UIScreen.mainScreen.bounds;
  CGFloat scale = UIScreen.mainScreen.scale;
  CGRect bounds = _bounds;
  LayoutDirection layoutDirection =
      [UIView userInterfaceLayoutDirectionForSemanticContentAttribute:UISemanticContentAttributeUnspecified] ==
          UIUserInterfaceLayoutDirectionRightToLeft
      ? LayoutDirection::RightToLeft
      : LayoutDirection::LeftToRight;

  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    [self prepareWithBounds:bounds scale:scale layoutDirection:layoutDirection];
    dispatch_group_leave(self->_prepared);
  });
}

- (void)prepareWithBounds:(CGRect)bounds scale:(CGFloat)scale layoutDirection:(LayoutDirection)layoutDirection
{
  NSURL *url = [[NSBundle mainBundle] URLForResource:kTemplateResourceName withExtension:@"json"];
  NSData *data = url ? [NSData dataWithContentsOfURL:url] : nil;
  id json = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
  if (![json isKindOfClass:[NSDictionary class]]) {
    NSLog(@"[expo-splash-screen] prerender: invalid %@.json, skipping", kTemplateResourceName);
    return;
  }
  folly::dynamic templateDynamic = convertIdToFollyDynamic(json);

  auto contextContainer = std::make_shared<ContextContainer>();
  _contextContainer = contextContainer;
  // A private descriptor registry with the core components only (no Image yet: its descriptor needs
  // an RCTImageLoader in the context container). Asking the component view factory
  // for one would tie it to every component registered later (and build their descriptors against
  // this context container, which has no bridge); the view classes themselves still come from the
  // factory when the mounting manager creates views.
  RCTMountingManager *mountingManager = [RCTMountingManager new];
  mountingManager.contextContainer = contextContainer;
  _mountingManager = mountingManager;
  _treeDelegate = std::make_unique<MountingTreeDelegate>(mountingManager);

  LayoutConstraints layoutConstraints{
      .minimumSize = {.width = (Float)bounds.size.width, .height = (Float)bounds.size.height},
      .maximumSize = {.width = (Float)bounds.size.width, .height = (Float)bounds.size.height},
      .layoutDirection = layoutDirection};
  LayoutContext layoutContext{};
  layoutContext.pointScaleFactor = (Float)scale;
  layoutContext.viewportSize = {.width = (Float)bounds.size.width, .height = (Float)bounds.size.height};
  _tree = std::make_unique<ShadowTree>(kSurfaceId, layoutConstraints, layoutContext, *_treeDelegate, *contextContainer);

  try {
    // Providers for view-producing components come from the component view classes, so their
    // component handles are the ones the view factory registered (React Native may be a prebuilt
    // framework; a template instantiated here would get a different handle). RawText and Text
    // produce no views, so local instantiations are fine.
    // The factory registers view classes lazily, when React asks for a component by name; the
    // mounting manager can only create views for classes it has registered.
    RCTComponentViewFactory *viewFactory = [RCTComponentViewFactory currentComponentViewFactory];
    [viewFactory registerComponentViewClass:[RCTViewComponentView class]];
    [viewFactory registerComponentViewClass:[RCTScrollViewComponentView class]];
    [viewFactory registerComponentViewClass:[RCTSafeAreaViewComponentView class]];

    auto providerRegistry = std::make_shared<ComponentDescriptorProviderRegistry>();
    providerRegistry->add([RCTViewComponentView componentDescriptorProvider]);
    providerRegistry->add([RCTParagraphComponentView componentDescriptorProvider]);
    providerRegistry->add([RCTScrollViewComponentView componentDescriptorProvider]);
    providerRegistry->add([RCTSafeAreaViewComponentView componentDescriptorProvider]);
    providerRegistry->add(concreteComponentDescriptorProvider<TextComponentDescriptor>());
    providerRegistry->add(concreteComponentDescriptorProvider<RawTextComponentDescriptor>());
    _providerRegistry = providerRegistry;
    _registry = providerRegistry->createComponentDescriptorRegistry(ComponentDescriptorParameters{
        .eventDispatcher = EventDispatcher::Shared{}, .contextContainer = contextContainer, .flavor = nullptr});
    TemplateBuilder builder(*_registry, *contextContainer);
    auto child = builder.build(templateDynamic);
    auto children = std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(
        std::vector<std::shared_ptr<const ShadowNode>>{child});
    const auto &currentRoot = *_tree->getCurrentRevision().rootShadowNode;
    auto newRoot = std::static_pointer_cast<RootShadowNode>(currentRoot.ShadowNode::clone(ShadowNodeFragment{.children = children}));
    std::vector<const LayoutableShadowNode *> affected;
    newRoot->layoutIfNeeded(&affected);
    _preparedRoot = newRoot;
    [self log:@"prepared (background)"];
  } catch (const std::exception &e) {
    NSLog(@"[expo-splash-screen] prerender: failed to build template: %s", e.what());
  }
}

#pragma mark - Main thread

- (void)mountIfPrepared
{
  RCTAssertMainQueue();
  [self log:_containerView ? @"mountIfPrepared (already mounted)" : @"mountIfPrepared"];
  if (_containerView || !_prepared) {
    return;
  }
  if (dispatch_group_wait(_prepared, dispatch_time(DISPATCH_TIME_NOW, 50 * NSEC_PER_MSEC)) != 0 || !_preparedRoot) {
    return;
  }

  UIView *container = [[UIView alloc] initWithFrame:_bounds];
  container.userInteractionEnabled = NO;
  [_mountingManager attachSurfaceToView:container surfaceId:kSurfaceId];
  _containerView = container;

  RootShadowNode::Unshared preparedRoot = _preparedRoot;
  _preparedRoot = nullptr;
  auto status = _tree->commit(
      [&](const RootShadowNode &) -> RootShadowNode::Unshared { return preparedRoot; },
      ShadowTree::CommitOptions{.mountSynchronously = true});
  if (status != ShadowTree::CommitStatus::Succeeded) {
    [self dismiss];
    return;
  }
  [self log:@"mounted"];
}

- (void)showInWindowScene:(UIWindowScene *)windowScene
{
  RCTAssertMainQueue();
  [self log:@"scene connect"];
  [self mountIfPrepared];
  if (!_containerView || _window) {
    return;
  }
  UIWindow *window = [[UIWindow alloc] initWithWindowScene:windowScene];
  window.windowLevel = UIWindowLevelNormal + 1;
  window.frame = windowScene.coordinateSpace.bounds;
  UIViewController *controller = [UIViewController new];
  controller.view = _containerView;
  window.rootViewController = controller;
  window.hidden = NO;
  _window = window;
  [self log:@"shown"];
}

- (void)dismissWithFadeDuration:(NSTimeInterval)duration
{
  if (!RCTIsMainQueue()) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self dismissWithFadeDuration:duration];
    });
    return;
  }
  UIView *container = _containerView;
  if (!_window || !container || duration <= 0) {
    [self dismiss];
    return;
  }
  [self log:@"fading out"];
  _window.backgroundColor = UIColor.clearColor;
  [UIView animateWithDuration:duration
                        delay:0
                      options:UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     container.alpha = 0;
                   }
                   completion:nil];
  // Tear down on our own clock: the completion block fires early when UIKit coalesces the animation.
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(duration * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self dismiss];
  });
}

- (void)dismiss
{
  if (_window) {
    [self log:@"dismissed"];
  }
  if (!RCTIsMainQueue()) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self dismiss];
    });
    return;
  }
  _window.hidden = YES;
  _window = nil;
  _containerView = nil;
  _preparedRoot = nullptr;
  _tree.reset();
  _treeDelegate.reset();
  _mountingManager = nil;
  _registry.reset();
  _providerRegistry.reset();
  _contextContainer.reset();
}

- (BOOL)isPrerenderRootView:(UIView *)view
{
  return [view isKindOfClass:[UIView class]] && view.tag == kSurfaceId;
}

@end
