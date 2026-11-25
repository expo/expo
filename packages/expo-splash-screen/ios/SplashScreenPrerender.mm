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

@end

#else

#import "SplashScreenSnapshot.h"

#import <CoreText/CoreText.h>

#import <React/RCTComponentViewFactory.h>
#import <React/RCTMountingManager.h>
#import <React/RCTParagraphComponentView.h>
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
NSNumber *const kSnapshotFormat = @2;

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
  NSDictionary<NSString *, id> *_snapshotFonts;
  NSDictionary *_snapshotEnvironment;
  __weak UIView *_appRootView;
  BOOL _dismissed;
  BOOL _sceneConnected;
  BOOL _capturePending;
  BOOL _captured;
  BOOL _waitedForPrepare;
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

// The constructor registers a notification observer so that `prepare` runs right after
// `ExpoReactNativeFactory` finishes init (which sets up the React Native feature flags).
// This is early in `didFinishLaunchingWithOptions:`, so the preparation gets a head start.
// Apps that never create the factory (brownfield apps that open React Native later) never
// trigger the notification, so the flags are not read before the app's override.
static void __attribute__((constructor)) ExpoSplashScreenPrerenderInit(void)
{
  SplashScreenPrerender *prerender = [SplashScreenPrerender shared];
  if (!prerender.isEnabled) {
    return;
  }
  [prerender log:@"constructor (registering observer)"];
  [[NSNotificationCenter defaultCenter]
      addObserverForName:@"ExpoReactNativeFactoryDidCreate"
                  object:nil
                   queue:nil
              usingBlock:^(NSNotification *) {
                [prerender log:@"factory created"];
                [prerender prepare];
              }];
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

- (void)prepare
{
  if (_prepared) {
    return;
  }
  if (![[NSFileManager defaultManager] fileExistsAtPath:[self snapshotURL].path]) {
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
    [self removePrepareMarker];
    return;
  }
  folly::dynamic templateDynamic = convertIdToFollyDynamic(json);
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
  [self removePrepareMarker];
}

- (void)removePrepareMarker
{
  NSURL *marker = [[self snapshotURL].URLByDeletingLastPathComponent URLByAppendingPathComponent:@"prepare-started"];
  [[NSFileManager defaultManager] removeItemAtURL:marker error:nil];
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
  NSFileManager *fileManager = [NSFileManager defaultManager];
  // A marker means the last prepare of this build crashed. Do not try again.
  NSURL *prepareMarkerURL = [snapshotURL.URLByDeletingLastPathComponent URLByAppendingPathComponent:@"prepare-started"];
  NSString *build = appBuild();
  if ([[NSString stringWithContentsOfURL:prepareMarkerURL encoding:NSUTF8StringEncoding error:nil] isEqualToString:build]) {
    [self log:@"snapshot: skipped, the last prepare of this build crashed"];
    [fileManager removeItemAtURL:snapshotURL error:nil];
    [fileManager removeItemAtURL:prepareMarkerURL error:nil];
    return nil;
  }
  NSData *snapshotData = [NSData dataWithContentsOfURL:snapshotURL];
  if (!snapshotData) {
    return nil;
  }
  // Write a marker before preparing. It is removed when prepareWithLayoutDirection: finishes.
  [fileManager createDirectoryAtURL:snapshotURL.URLByDeletingLastPathComponent withIntermediateDirectories:YES attributes:nil error:nil];
  [build writeToURL:prepareMarkerURL atomically:NO encoding:NSUTF8StringEncoding error:nil];
  id snapshot = [NSJSONSerialization JSONObjectWithData:snapshotData options:0 error:nil];
  NSDictionary *environment = [snapshot isKindOfClass:[NSDictionary class]] ? snapshot[@"environment"] : nil;
  if (![environment isKindOfClass:[NSDictionary class]] || ![environment[@"build"] isEqual:build] ||
      ![environment[@"format"] isEqual:kSnapshotFormat] || ![snapshot[@"template"] isKindOfClass:[NSDictionary class]]) {
    [self log:@"snapshot does not match this build"];
    [fileManager removeItemAtURL:prepareMarkerURL error:nil];
    return nil;
  }
  _snapshotEnvironment = environment;
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
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_captured || self->_capturePending) {
      return;
    }
    self->_capturePending = YES;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      self->_capturePending = NO;
      [self saveLaunchScreen];
    });
  });
}

/**
 Serializes what is on screen in the app's root view, with the frames UIKit resolved, and stores it
 in the Caches directory for the next launch.
 */
- (void)saveLaunchScreen
{
  RCTAssertMainQueue();
  if (_captured) {
    return;
  }
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
  if (budget < 0) {
    [fileManager removeItemAtURL:markerURL error:nil];
    [self log:@"snapshot: view budget exhausted, partial capture discarded"];
    return;
  }
  templateDynamic["props"].erase("position");
  templateDynamic["props"].erase("left");
  templateDynamic["props"].erase("top");
  NSDictionary *fonts = [[self class] fontFilesForFamilies:[[self class] fontFamiliesUsedByTemplate:templateDynamic]];
  NSDictionary *snapshot = @{
    @"environment" : [self environmentKeyForSize:rootView.bounds.size windowScene:windowScene],
    @"fonts" : fonts,
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
/// once `expo-font` has registered them. Returns all faces per family (regular, bold, italic, etc.).
+ (NSDictionary<NSString *, NSArray<NSString *> *> *)fontFilesForFamilies:(NSSet<NSString *> *)families
{
  NSMutableDictionary *files = [NSMutableDictionary dictionary];
  NSString *bundlePath = [NSBundle mainBundle].bundlePath;
  for (NSString *family in families) {
    CTFontDescriptorRef descriptor = CTFontDescriptorCreateWithAttributes(
        (__bridge CFDictionaryRef) @{(__bridge NSString *)kCTFontFamilyNameAttribute : family});
    CFArrayRef matches = CTFontDescriptorCreateMatchingFontDescriptors(descriptor, NULL);
    CFRelease(descriptor);
    if (!matches) {
      continue;
    }
    NSMutableArray<NSString *> *paths = [NSMutableArray array];
    for (CFIndex i = 0, count = CFArrayGetCount(matches); i < count; i++) {
      CTFontDescriptorRef match = (CTFontDescriptorRef)CFArrayGetValueAtIndex(matches, i);
      NSURL *url = CFBridgingRelease(CTFontDescriptorCopyAttribute(match, kCTFontURLAttribute));
      NSString *path = url.path;
      if ([path hasPrefix:bundlePath]) {
        NSString *relative = [path substringFromIndex:bundlePath.length];
        if (![paths containsObject:relative]) {
          [paths addObject:relative];
        }
      }
    }
    CFRelease(matches);
    if (paths.count > 0) {
      files[family] = [paths copy];
    }
  }
  return files;
}

- (void)registerFontsUsedByTemplate:(const folly::dynamic &)node
{
  NSSet<NSString *> *families = [[self class] fontFamiliesUsedByTemplate:node];
  for (NSString *family in families) {
    if ([UIFont fontNamesForFamilyName:family].count > 0) {
      continue;
    }
    id fontEntry = _snapshotFonts[family];
    // Supports both the current array format and the legacy single-string format.
    NSArray<NSString *> *files = [fontEntry isKindOfClass:[NSArray class]] ? fontEntry
                                 : [fontEntry isKindOfClass:[NSString class]] ? @[fontEntry]
                                                                             : nil;
    for (NSString *file in files) {
      NSURL *url = [NSURL fileURLWithPath:[[NSBundle mainBundle].bundlePath stringByAppendingString:file]];
      bool registered = CTFontManagerRegisterFontsForURL((__bridge CFURLRef)url, kCTFontManagerScopeProcess, NULL);
      [self log:[NSString stringWithFormat:@"font %@ %@ from %@", family, registered ? @"registered" : @"not registered", file]];
    }
  }
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
  // Wait once: a non-blocking notify replaces the second blocking wait.
  if (!_waitedForPrepare) {
    _waitedForPrepare = YES;
    if (dispatch_group_wait(_prepared, dispatch_time(DISPATCH_TIME_NOW, 50 * NSEC_PER_MSEC)) != 0) {
      dispatch_group_notify(_prepared, dispatch_get_main_queue(), ^{
        [self mountPreparedTree];
      });
      return;
    }
  }
  [self mountPreparedTree];
}

- (void)mountPreparedTree
{
  RCTAssertMainQueue();
  if (_containerView || _dismissed || !_preparedRoot) {
    return;
  }
  // The notify fired after showInWindowScene: already returned — too late to show.
  if (_sceneConnected && !_window) {
    [self dismiss];
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
  _sceneConnected = YES;
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
  // The snapshot was shown; consume it so the next capture writes the new one.
  [[NSFileManager defaultManager] removeItemAtURL:[self snapshotURL] error:nil];
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
