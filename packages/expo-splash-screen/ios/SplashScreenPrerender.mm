// Copyright 2015-present 650 Industries. All rights reserved.

#import "SplashScreenPrerender.h"

#import <TargetConditionals.h>

#if TARGET_OS_TV

// tvOS has no prerender. The snapshot code uses UIKit colors that tvOS does not have.
@implementation SplashScreenPrerender

+ (instancetype)shared
{
  static SplashScreenPrerender *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [SplashScreenPrerender new];
  });
  return instance;
}

- (BOOL)isShown
{
  return NO;
}

- (void)mountIfPrepared
{
}

- (void)showInWindowScene:(UIWindowScene *)windowScene
{
}

- (void)dismissWithFadeDuration:(NSTimeInterval)duration
{
}

- (BOOL)isPrerenderRootView:(UIView *)view
{
  return NO;
}

- (void)setAppRootView:(nullable UIView *)rootView
{
}

- (void)captureLaunchScreenAfterDelay:(NSTimeInterval)delay
{
}

- (void)hydrateAppSurfaceWhenReady
{
}

- (BOOL)shouldIgnoreContentDidAppear
{
  return NO;
}

@end

#else

#import "SplashScreenHydration.h"
#import "SplashScreenSnapshot.h"

#import <CoreText/CoreText.h>
#import <objc/message.h>

#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTMountingManager.h>
#import <React/RCTParagraphComponentView.h>
#import <React/RCTScheduler.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfaceProtocol.h>
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

namespace {

// Root tags end in 1; this one is far above anything React allocates.
const SurfaceId kSurfaceId = 900001;

// Increment when the snapshot format changes. A rebuild with the same build number keeps old snapshots.
NSNumber *const kSnapshotFormat = @3;

NSString *appBuild()
{
  NSDictionary *info = [[NSBundle mainBundle] infoDictionary];
  return [NSString stringWithFormat:@"%@ %@", info[@"CFBundleShortVersionString"], info[@"CFBundleVersion"]];
}

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
    // The registry takes React's view names, and "Text" is the paragraph there.
    const std::string name = node["name"].asString();
    const auto &descriptor = registry_.at(name == "Text" ? "VirtualText" : name);
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
  CFTimeInterval _loadTime;
  NSDictionary<NSString *, NSString *> *_snapshotFonts;
  NSDictionary *_snapshotEnvironment;
  __weak UIView *_appRootView;
  BOOL _dismissed;
  BOOL _capturePending;
  BOOL _captured;
  // Hydration
  NSInteger _snapshotRootTag;
  folly::dynamic _snapshotTemplate;
  std::shared_ptr<expo::SplashScreenTransactionWatcher> _transactionWatcher;
  BOOL _hydrated;
  BOOL _reactCommitted;
  BOOL _flushPending;
  int _adoptedTotal;
  CFTimeInterval _lastTransactionTime;
  NSTimeInterval _pendingCaptureDelay;
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
    BOOL snapshot = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"ExpoSplashScreenPrerenderSnapshot"] boolValue];
    _isEnabled = !disabled && snapshot && !RCTRunningInAppExtension();
    _loadTime = CACurrentMediaTime();
  }
  return self;
}

- (void)log:(NSString *)stage
{
  if (![[NSUserDefaults standardUserDefaults] boolForKey:@"ExpoSplashScreenPrerenderLog"]) {
    return;
  }
  NSLog(@"[expo-splash-screen] prerender %@ at %.1f ms since load", stage, (CACurrentMediaTime() - _loadTime) * 1000.0);
}

#pragma mark - Preparation (background)

/**
 React Native's feature flags can be overridden once and must not be read before that.
 `RCTReactNativeFactory` overrides them in its init, inside `didFinishLaunching`, and the renderer
 reads them everywhere. Running the factory's one-time setup here, with the release level it would
 use, lets the renderer run before the factory exists; the factory's later call is then a no-op.
 The later call raises an exception when its release level is different. An app that creates
 `RCTReactNativeFactory` with a release level must set the same level in `ReactNativeReleaseLevel`.
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
  if (_prepared) {
    return;
  }
  // The feature flags are set up only when there is a snapshot to draw.
  if (![[NSFileManager defaultManager] fileExistsAtPath:[self snapshotURL].path] || ![self setUpFeatureFlagsEarly]) {
    [self log:@"no snapshot for this launch"];
    return;
  }
  _prepared = dispatch_group_create();
  dispatch_group_enter(_prepared);
  LayoutDirection layoutDirection =
      [UIView userInterfaceLayoutDirectionForSemanticContentAttribute:UISemanticContentAttributeUnspecified] ==
          UIUserInterfaceLayoutDirectionRightToLeft
      ? LayoutDirection::RightToLeft
      : LayoutDirection::LeftToRight;

  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    [self prepareWithLayoutDirection:layoutDirection];
    dispatch_group_leave(self->_prepared);
  });
}

/// Background thread. The main thread reads what this writes only after `_prepared` is done.
- (void)prepareWithLayoutDirection:(LayoutDirection)layoutDirection
{
  NSDictionary *json = [self loadTemplate];
  if (!json) {
    [self log:@"no snapshot for this launch"];
    return;
  }
  folly::dynamic templateDynamic = convertIdToFollyDynamic(json);
  _snapshotTemplate = templateDynamic;
  [self registerFontsUsedByTemplate:templateDynamic];

  // The layout uses the size and the scale of the snapshot. `showInWindowScene:` compares them with the window.
  CGRect bounds = CGRectMake(0, 0, [_snapshotEnvironment[@"width"] doubleValue], [_snapshotEnvironment[@"height"] doubleValue]);
  CGFloat scale = [_snapshotEnvironment[@"scale"] doubleValue];
  _bounds = bounds;

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

    auto providerRegistry = std::make_shared<ComponentDescriptorProviderRegistry>();
    providerRegistry->add([RCTViewComponentView componentDescriptorProvider]);
    providerRegistry->add([RCTParagraphComponentView componentDescriptorProvider]);
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

#pragma mark - Snapshot file

/// Where the snapshot of the last launch's first screen lives: `Caches/expo-splash-screen`.
/// The file is a cache: the system does not back it up and can delete it.
- (NSURL *)snapshotURL
{
  NSURL *caches = [[NSFileManager defaultManager] URLForDirectory:NSCachesDirectory
                                                         inDomain:NSUserDomainMask
                                                appropriateForURL:nil
                                                           create:NO
                                                            error:nil];
  return [[caches URLByAppendingPathComponent:@"expo-splash-screen" isDirectory:YES]
      URLByAppendingPathComponent:@"launch-snapshot.json"];
}

/**
 What a snapshot was taken under. A snapshot replays only when all of it still matches: frames are
 absolute, so a different window, text size or appearance would draw the wrong screen.
 The capture and `showInWindowScene:` both read the traits of the window scene.
 */
- (NSDictionary *)environmentKeyForSize:(CGSize)size windowScene:(UIWindowScene *)windowScene
{
  UITraitCollection *traits = windowScene.traitCollection;
  return @{
    @"width" : @(size.width),
    @"height" : @(size.height),
    @"scale" : @(windowScene.screen.scale),
    @"appearance" : @(traits.userInterfaceStyle),
    @"contentSize" : traits.preferredContentSizeCategory ?: @"",
    @"build" : appBuild(),
    @"format" : kSnapshotFormat,
  };
}

/// Background thread. Uses no UIKit state: the window is compared in `showInWindowScene:`.
- (nullable NSDictionary *)loadTemplate
{
  NSURL *snapshotURL = [self snapshotURL];
  NSData *snapshotData = [NSData dataWithContentsOfURL:snapshotURL];
  // A snapshot is used for one launch only: the capture after the splash hides writes the next one.
  // A snapshot that crashes the prerender then cannot crash every launch.
  if (!snapshotData || ![[NSFileManager defaultManager] removeItemAtURL:snapshotURL error:nil]) {
    return nil;
  }
  id snapshot = [NSJSONSerialization JSONObjectWithData:snapshotData options:0 error:nil];
  NSDictionary *environment = [snapshot isKindOfClass:[NSDictionary class]] ? snapshot[@"environment"] : nil;
  if (![environment isKindOfClass:[NSDictionary class]] || ![environment[@"build"] isEqual:appBuild()] ||
      ![environment[@"format"] isEqual:kSnapshotFormat] || ![snapshot[@"template"] isKindOfClass:[NSDictionary class]]) {
    [self log:@"snapshot does not match this build"];
    return nil;
  }
  _snapshotEnvironment = environment;
  _snapshotRootTag = [snapshot[@"rootTag"] isKindOfClass:[NSNumber class]] ? [snapshot[@"rootTag"] integerValue] : 0;
  _snapshotFonts = [snapshot[@"fonts"] isKindOfClass:[NSDictionary class]] ? snapshot[@"fonts"] : nil;
  return snapshot[@"template"];
}

#pragma mark - Snapshot

- (void)setAppRootView:(nullable UIView *)rootView
{
  _appRootView = rootView;
}

- (void)captureLaunchScreenAfterDelay:(NSTimeInterval)delay
{
  if (_captured || _capturePending) {
    return;
  }
  if (_hydrated && !_reactCommitted) {
    // The screen on display is still the prerender. Capture after React has taken over.
    _pendingCaptureDelay = MAX(delay, 0.5);
    return;
  }
  _capturePending = YES;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    self->_capturePending = NO;
    // The views that React did not adopt must not be in the snapshot.
    [self flushHydration];
    [self saveLaunchScreen];
  });
}

/**
 Serializes what is on screen in the app's root view, with the frames UIKit resolved, and stores it
 in the Caches directory for the next launch.
 */
- (void)saveLaunchScreen
{
  RCTAssertMainQueue();
  UIView *rootView = _appRootView;
  UIWindowScene *windowScene = rootView.window.windowScene;
  if (!_isEnabled || !rootView || !windowScene) {
    return;
  }
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSURL *url = [self snapshotURL];
  // The marker file stays when the capture crashes. This build then does not capture again,
  // so a crash in the capture cannot repeat on every launch.
  NSURL *markerURL = [url.URLByDeletingLastPathComponent URLByAppendingPathComponent:@"capture-started"];
  NSString *build = appBuild();
  if ([[NSString stringWithContentsOfURL:markerURL encoding:NSUTF8StringEncoding error:nil] isEqualToString:build]) {
    _captured = YES;
    [self log:@"snapshot: skipped, the last capture of this build did not finish"];
    return;
  }
  [fileManager createDirectoryAtURL:url.URLByDeletingLastPathComponent withIntermediateDirectories:YES attributes:nil error:nil];
  [build writeToURL:markerURL atomically:NO encoding:NSUTF8StringEncoding error:nil];

  CFTimeInterval start = CACurrentMediaTime();
  int budget = 5000;
  bool debug = [[NSUserDefaults standardUserDefaults] boolForKey:@"ExpoSplashScreenPrerenderLog"];
  folly::dynamic templateDynamic = expo::serializeSplashScreenSnapshot(rootView, budget, debug);
  if (templateDynamic.isNull() || templateDynamic["children"].empty()) {
    [fileManager removeItemAtURL:markerURL error:nil];
    [self log:@"snapshot: nothing on screen"];
    return;
  }
  templateDynamic["props"].erase("position");
  templateDynamic["props"].erase("left");
  templateDynamic["props"].erase("top");
  NSDictionary *fonts = [[self class] fontFilesForFamilies:[[self class] fontFamiliesUsedByTemplate:templateDynamic]];
  NSDictionary *snapshot = @{
    @"environment" : [self environmentKeyForSize:rootView.bounds.size windowScene:windowScene],
    @"fonts" : fonts,
    @"rootTag" : @([rootView isKindOfClass:[RCTSurfaceHostingProxyRootView class]]
        ? ((RCTSurfaceHostingProxyRootView *)rootView).surface.rootTag
        : 0),
    @"template" : convertFollyDynamicToId(templateDynamic)
  };
  [fileManager removeItemAtURL:markerURL error:nil];
  _captured = YES;
  [self log:[NSString stringWithFormat:@"snapshot serialized (%d views) in %.1f ms", 5000 - budget,
                                       (CACurrentMediaTime() - start) * 1000.0]];
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
    NSData *data = [NSJSONSerialization dataWithJSONObject:snapshot options:0 error:nil];
    BOOL written = [data writeToURL:url options:NSDataWritingAtomic | NSDataWritingFileProtectionComplete error:nil];
    [self log:[NSString stringWithFormat:@"snapshot %@ (%lu bytes)", written ? @"saved" : @"not saved", (unsigned long)data.length]];
  });
}

#pragma mark - Fonts

/**
 Custom fonts (icon fonts, brand fonts) are registered by `expo-font` once JS runs. A template that
 uses one names its family; the matching font file in the app bundle is registered here first.
 */
+ (NSSet<NSString *> *)fontFamiliesUsedByTemplate:(const folly::dynamic &)node
{
  NSMutableSet<NSString *> *families = [NSMutableSet set];
  std::function<void(const folly::dynamic &)> collect = [&](const folly::dynamic &n) {
    if (n.isObject()) {
      if (n.count("props") && n["props"].isObject() && n["props"].count("fontFamily") && n["props"]["fontFamily"].isString()) {
        [families addObject:@(n["props"]["fontFamily"].c_str())];
      }
      if (n.count("children") && n["children"].isArray()) {
        for (const auto &child : n["children"]) {
          collect(child);
        }
      }
    }
  };
  collect(node);
  return families;
}

/// Font files (relative to the app bundle) for the families a snapshot uses, as CoreText knows them
/// once `expo-font` has registered them.
+ (NSDictionary<NSString *, NSString *> *)fontFilesForFamilies:(NSSet<NSString *> *)families
{
  NSMutableDictionary *files = [NSMutableDictionary dictionary];
  NSString *bundlePath = [NSBundle mainBundle].bundlePath;
  for (NSString *family in families) {
    CTFontDescriptorRef descriptor = CTFontDescriptorCreateWithAttributes(
        (__bridge CFDictionaryRef) @{(__bridge NSString *)kCTFontFamilyNameAttribute : family});
    CTFontDescriptorRef match = CTFontDescriptorCreateMatchingFontDescriptor(descriptor, NULL);
    CFRelease(descriptor);
    if (!match) {
      continue;
    }
    NSURL *url = CFBridgingRelease(CTFontDescriptorCopyAttribute(match, kCTFontURLAttribute));
    CFRelease(match);
    NSString *path = url.path;
    if ([path hasPrefix:bundlePath]) {
      files[family] = [path substringFromIndex:bundlePath.length];
    }
  }
  return files;
}

- (void)registerFontsUsedByTemplate:(const folly::dynamic &)node
{
  NSSet<NSString *> *families = [[self class] fontFamiliesUsedByTemplate:node];
  for (NSString *family in families) {
    NSString *file = _snapshotFonts[family];
    if (!file || [UIFont fontNamesForFamilyName:family].count > 0) {
      continue;
    }
    NSURL *url = [NSURL fileURLWithPath:[[NSBundle mainBundle].bundlePath stringByAppendingString:file]];
    bool registered = CTFontManagerRegisterFontsForURL((__bridge CFURLRef)url, kCTFontManagerScopeProcess, NULL);
    [self log:[NSString stringWithFormat:@"font %@ %@ from %@", family, registered ? @"registered" : @"not registered", file]];
  }
}

#pragma mark - Hydration (snapshot committed into the app's surface)

/// Experimental, off by default: `ExpoSplashScreenPrerenderHydrate` in Info.plist or as a launch argument.
- (BOOL)isHydrationEnabled
{
  id launchArgument = [[NSUserDefaults standardUserDefaults] objectForKey:@"ExpoSplashScreenPrerenderHydrate"];
  if (launchArgument != nil) {
    return [launchArgument boolValue];
  }
  return [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"ExpoSplashScreenPrerenderHydrate"] boolValue];
}

- (void)hydrateAppSurfaceWhenReady
{
  RCTAssertMainQueue();
  // The overlay is on screen, so the background preparation is done and the snapshot matches the window.
  if (!_isEnabled || !_window || ![self isHydrationEnabled] || _snapshotRootTag == 0 || _snapshotTemplate.isNull()) {
    return;
  }
  [self log:@"hydration: waiting for the app surface"];
  [self tryHydrateUntil:CACurrentMediaTime() + 3.0];
}

- (void)tryHydrateUntil:(CFTimeInterval)deadline
{
  UIView *rootView = _appRootView;
  if (_hydrated || _dismissed || !rootView || ![rootView isKindOfClass:[RCTSurfaceHostingProxyRootView class]]) {
    return;
  }
  id<RCTSurfaceProtocol> surface = ((RCTSurfaceHostingProxyRootView *)rootView).surface;
  RCTSurfacePresenter *presenter = [(NSObject *)surface valueForKey:@"surfacePresenter"];
  std::shared_ptr<UIManager> uiManager = presenter.scheduler.uiManager;
  SurfaceId surfaceId = (SurfaceId)surface.rootTag;
  bool found = false;
  bool empty = false;
  std::shared_ptr<const MountingCoordinator> coordinator;
  if (uiManager) {
    uiManager->getShadowTreeRegistry().visit(surfaceId, [&](const ShadowTree &tree) {
      found = true;
      empty = tree.getCurrentRevision().rootShadowNode->getChildren().empty();
      coordinator = tree.getMountingCoordinator();
    });
  }
  if (!found) {
    // The host starts the surface only after the bundle has loaded; its shadow tree appears on the
    // JS thread right before React's first render, so this polls fast and commits in that window.
    if (CACurrentMediaTime() < deadline) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 4 * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
        [self tryHydrateUntil:deadline];
      });
    } else {
      [self log:@"hydration: app surface did not appear in time"];
    }
    return;
  }
  if (!empty) {
    [self log:@"hydration: React already committed, skipping"];
    return;
  }
  if (surfaceId != _snapshotRootTag) {
    [self log:[NSString stringWithFormat:@"hydration: surface %d but snapshot was taken on %ld, skipping", surfaceId, (long)_snapshotRootTag]];
    return;
  }

  // The snapshot's structure above React's root component view (the hosting view, the surface
  // view) is UIKit; React's children hang directly off the surface's root node.
  const folly::dynamic *reactRoot = nullptr;
  std::function<void(const folly::dynamic &)> findRoot = [&](const folly::dynamic &n) {
    if (reactRoot) {
      return;
    }
    if (n.count("tag") != 0 && n["tag"].isInt() && n["tag"].asInt() == surfaceId) {
      reactRoot = &n;
      return;
    }
    if (n.count("children") != 0) {
      for (const auto &child : n["children"]) {
        findRoot(child);
      }
    }
  };
  findRoot(_snapshotTemplate);
  if (!reactRoot) {
    [self log:@"hydration: snapshot has no React root view, skipping"];
    return;
  }
  // Touches would reach views whose event emitters have no React instance behind them yet.
  rootView.userInteractionEnabled = NO;
  try {
    expo::SplashScreenHydrationBuilder builder(*uiManager, surfaceId);
    auto children = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
    builder.buildRootChildren(*reactRoot, *children);
    // Watch the transactions that follow: hold React's deletes of these nodes, adopt on matching creates.
    __weak SplashScreenPrerender *weakSelf = self;
    RCTComponentViewRegistry *viewRegistry = presenter.mountingManager.componentViewRegistry;
    _transactionWatcher = std::make_shared<expo::SplashScreenTransactionWatcher>(
        builder.prerenderedTags(),
        [viewRegistry](Tag tag, bool held) {
          // Mounting thread (main).
          UIView *view = [viewRegistry findComponentViewWithTag:tag];
          // React inserts its views by index, so a held view stays in front of them in the subview
          // order. Hide it: the window then shows only React's tree, and the overlay does not need
          // to cover until the held views are removed. The overlay still covers at this time,
          // because the app hides the splash screen only after React's first commit.
          view.hidden = held;
          if (!held) {
            // React inserts the adopted view into its own tree in the same transaction. A native
            // container that React puts into the view before that (a react-native-screens stack)
            // looks for its parent view controller when it moves to the window, and must not find
            // the one of the prerendered tree.
            [view removeFromSuperview];
          }
        },
        [weakSelf](expo::SplashScreenTransactionWatcher::Stats stats) {
          dispatch_async(dispatch_get_main_queue(), ^{
            [weakSelf didObserveTransaction:stats];
          });
        });
    coordinator->setMountingOverrideDelegate(_transactionWatcher);
    uiManager->completeSurface(surfaceId, children, ShadowTree::CommitOptions{.mountSynchronously = true});
    _hydrated = YES;
    [self log:[NSString stringWithFormat:@"hydration: committed %d nodes into surface %d, %d with React's tags and components",
                                         builder.created(), surfaceId, builder.reused()]];
  } catch (const std::exception &e) {
    rootView.userInteractionEnabled = YES;
    NSLog(@"[expo-splash-screen] prerender: hydration failed: %s", e.what());
  }
}

- (void)didObserveTransaction:(expo::SplashScreenTransactionWatcher::Stats)stats
{
  _lastTransactionTime = CACurrentMediaTime();
  _adoptedTotal += stats.adopted;
  if (_reactCommitted || stats.isHydrationCommit || stats.isEmpty) {
    return;
  }
  _reactCommitted = YES;
  _appRootView.userInteractionEnabled = YES;
  [self log:@"hydration: React's first commit landed, interaction enabled"];
  // The hosting view already reported "content did appear" for the hydration mount (ignored by the
  // splash screen manager); React's own first content is what the app is waiting for.
  [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTContentDidAppearNotification" object:_appRootView];
  if (_pendingCaptureDelay > 0) {
    NSTimeInterval delay = _pendingCaptureDelay;
    _pendingCaptureDelay = 0;
    [self captureLaunchScreenAfterDelay:delay];
  }
}

- (BOOL)shouldIgnoreContentDidAppear
{
  return _hydrated && !_reactCommitted;
}

/// The app hid the splash screen: its first screen is up. Once React has been quiet for a moment,
/// the prerendered views it did not adopt are removed. The snapshot capture removes them at the latest.
- (void)flushHydrationIfSettled
{
  if (!_flushPending) {
    return;
  }
  CFTimeInterval quietFor = CACurrentMediaTime() - _lastTransactionTime;
  if (quietFor < 0.25) {
    __weak SplashScreenPrerender *weakSelf = self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)((0.25 - quietFor) * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      [weakSelf flushHydrationIfSettled];
    });
    return;
  }
  [self flushHydration];
}

- (void)flushHydration
{
  _flushPending = NO;
  if (!_transactionWatcher || !_transactionWatcher->isActive()) {
    return;
  }
  UIView *rootView = _appRootView;
  id<RCTSurfaceProtocol> surface =
      [rootView isKindOfClass:[RCTSurfaceHostingProxyRootView class]] ? ((RCTSurfaceHostingProxyRootView *)rootView).surface : nil;
  RCTSurfacePresenter *presenter = surface ? [(NSObject *)surface valueForKey:@"surfacePresenter"] : nil;
  RCTComponentViewRegistry *registry = presenter.mountingManager.componentViewRegistry;
  int removed = 0;
  for (Tag tag : _transactionWatcher->heldTags()) {
    UIView<RCTComponentViewProtocol> *view = [registry findComponentViewWithTag:tag];
    if (!view) {
      continue;
    }
    [view removeFromSuperview];
    view.hidden = NO;
    if ([view isKindOfClass:[RCTViewComponentView class]]) {
      RCTComponentViewDescriptor descriptor = [registry componentViewDescriptorWithTag:tag];
      [registry enqueueComponentViewWithComponentHandle:[[view class] componentDescriptorProvider].handle
                                                    tag:tag
                                componentViewDescriptor:descriptor];
    }
    removed++;
  }
  _transactionWatcher->deactivate();
  [self log:[NSString stringWithFormat:@"hydration: done, React adopted %d prerendered views, %d removed", _adoptedTotal, removed]];
}

#pragma mark - Main thread

- (BOOL)isShown
{
  return _window != nil;
}

- (void)mountIfPrepared
{
  RCTAssertMainQueue();
  [self log:_containerView ? @"mountIfPrepared (already mounted)" : @"mountIfPrepared"];
  if (_containerView || !_prepared || _dismissed) {
    return;
  }
  // `_preparedRoot` and the other objects of the preparation are read only after the group is done.
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
  NSDictionary *expected = [self environmentKeyForSize:windowScene.coordinateSpace.bounds.size windowScene:windowScene];
  if (![_snapshotEnvironment isEqualToDictionary:expected]) {
    [self log:[NSString stringWithFormat:@"snapshot does not match this window: %@ is not %@", _snapshotEnvironment, expected]];
    [self dismiss];
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
  if (_transactionWatcher && _transactionWatcher->isActive() && !_flushPending) {
    // React can still adopt prerendered views. The ones it did not adopt are hidden, so the
    // overlay fades now, and they go when React has settled.
    _flushPending = YES;
    [self log:@"hydration: splash hidden, waiting for React to settle"];
    [self flushHydrationIfSettled];
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
  _dismissed = YES;
  if (!_prepared) {
    return;
  }
  // The background preparation can still run when a wait for it timed out. Release its objects after it is done.
  dispatch_group_notify(_prepared, dispatch_get_main_queue(), ^{
    self->_preparedRoot = nullptr;
    self->_tree.reset();
    self->_treeDelegate.reset();
    self->_mountingManager = nil;
    self->_registry.reset();
    self->_providerRegistry.reset();
    self->_contextContainer.reset();
  });
}

- (BOOL)isPrerenderRootView:(UIView *)view
{
  return [view isKindOfClass:[UIView class]] && view.tag == kSurfaceId;
}

@end

#endif // TARGET_OS_TV
