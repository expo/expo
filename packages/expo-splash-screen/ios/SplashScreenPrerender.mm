// Copyright 2015-present 650 Industries. All rights reserved.

#import "SplashScreenPrerender.h"
#import "SplashScreenSnapshot.h"

#import <CoreText/CoreText.h>
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

namespace {

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
  __weak UIView *_appRootView;
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
  NSDictionary *json = [self loadTemplate];
  if (!json) {
    // First launch, or the snapshot does not match this launch.
    [self log:@"no snapshot for this launch"];
    return;
  }
  folly::dynamic templateDynamic = convertIdToFollyDynamic(json);
  [self registerFontsUsedByTemplate:templateDynamic];

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

#pragma mark - Snapshot file

/// Where the snapshot of the last launch's first screen lives: `Application Support/expo-splash-screen`.
- (NSURL *)snapshotURL
{
  NSURL *support = [[NSFileManager defaultManager] URLForDirectory:NSApplicationSupportDirectory
                                                          inDomain:NSUserDomainMask
                                                 appropriateForURL:nil
                                                            create:NO
                                                             error:nil];
  return [[support URLByAppendingPathComponent:@"expo-splash-screen" isDirectory:YES]
      URLByAppendingPathComponent:@"launch-snapshot.json"];
}

/**
 What a snapshot was taken under. A snapshot replays only when all of it still matches: frames are
 absolute, so a different window, text size or appearance would draw the wrong screen.
 */
- (NSDictionary *)environmentKeyForTraits:(UITraitCollection *)traits bounds:(CGRect)bounds scale:(CGFloat)scale
{
  NSDictionary *info = [[NSBundle mainBundle] infoDictionary];
  return @{
    @"width" : @(bounds.size.width),
    @"height" : @(bounds.size.height),
    @"scale" : @(scale),
    @"appearance" : @(traits.userInterfaceStyle),
    @"contentSize" : traits.preferredContentSizeCategory ?: @"",
    @"build" : [NSString stringWithFormat:@"%@ %@", info[@"CFBundleShortVersionString"], info[@"CFBundleVersion"]],
    // Increment when the snapshot format changes. A rebuild with the same build number keeps old snapshots.
    @"format" : @1,
  };
}

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
  NSDictionary *expected = [self environmentKeyForTraits:UIScreen.mainScreen.traitCollection
                                                  bounds:UIScreen.mainScreen.bounds
                                                   scale:UIScreen.mainScreen.scale];
  if (![snapshot isKindOfClass:[NSDictionary class]] || ![snapshot[@"environment"] isEqualToDictionary:expected] ||
      ![snapshot[@"template"] isKindOfClass:[NSDictionary class]]) {
    [self log:@"snapshot does not match this environment"];
    return nil;
  }
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
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self saveLaunchScreen];
  });
}

/**
 Serializes what is on screen in the app's root view, with the frames UIKit resolved, and stores it
 in the app container for the next launch.
 */
- (void)saveLaunchScreen
{
  RCTAssertMainQueue();
  UIView *rootView = _appRootView;
  if (!_isEnabled || !rootView || !rootView.window) {
    return;
  }
  int budget = 5000;
  bool debug = [[NSUserDefaults standardUserDefaults] boolForKey:@"ExpoSplashScreenPrerenderLog"];
  folly::dynamic templateDynamic = expo::serializeSplashScreenSnapshot(rootView, budget, debug);
  if (templateDynamic.isNull() || templateDynamic["children"].empty()) {
    [self log:@"snapshot: nothing on screen"];
    return;
  }
  templateDynamic["props"].erase("position");
  templateDynamic["props"].erase("left");
  templateDynamic["props"].erase("top");
  NSDictionary *environment = [self environmentKeyForTraits:rootView.traitCollection
                                                     bounds:UIScreen.mainScreen.bounds
                                                      scale:UIScreen.mainScreen.scale];
  NSURL *url = [self snapshotURL];
  NSDictionary *fonts = [[self class] fontFilesForFamilies:[[self class] fontFamiliesUsedByTemplate:templateDynamic]];
  NSDictionary *snapshot = @{
    @"environment" : environment,
    @"fonts" : fonts,
    @"template" : convertFollyDynamicToId(templateDynamic)
  };
  [self log:[NSString stringWithFormat:@"snapshot serialized (%d views)", 5000 - budget]];
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
    NSData *data = [NSJSONSerialization dataWithJSONObject:snapshot options:0 error:nil];
    [[NSFileManager defaultManager] createDirectoryAtURL:url.URLByDeletingLastPathComponent
                             withIntermediateDirectories:YES
                                              attributes:nil
                                                   error:nil];
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
    if ([UIFont fontNamesForFamilyName:family].count > 0) {
      continue;
    }
    NSString *knownFile = _snapshotFonts[family];
    if (knownFile) {
      NSURL *url = [NSURL fileURLWithPath:[[NSBundle mainBundle].bundlePath stringByAppendingString:knownFile]];
      bool registered = CTFontManagerRegisterFontsForURL((__bridge CFURLRef)url, kCTFontManagerScopeProcess, NULL);
      [self log:[NSString stringWithFormat:@"font %@ %@ from %@", family, registered ? @"registered" : @"not registered", knownFile]];
      if (registered) {
        continue;
      }
    }
    NSDirectoryEnumerator *files = [[NSFileManager defaultManager] enumeratorAtURL:[NSBundle mainBundle].bundleURL
                                                        includingPropertiesForKeys:nil
                                                                           options:NSDirectoryEnumerationSkipsHiddenFiles
                                                                      errorHandler:nil];
    for (NSURL *url in files) {
      NSString *extension = url.pathExtension.lowercaseString;
      if (([extension isEqualToString:@"ttf"] || [extension isEqualToString:@"otf"]) &&
          [url.lastPathComponent.stringByDeletingPathExtension caseInsensitiveCompare:family] == NSOrderedSame) {
        CFErrorRef error = NULL;
        bool registered = CTFontManagerRegisterFontsForURL((__bridge CFURLRef)url, kCTFontManagerScopeProcess, &error);
        [self log:[NSString stringWithFormat:@"font %@ %@", family, registered ? @"registered" : @"not registered"]];
        if (error) CFRelease(error);
        break;
      }
    }
  }
}

#pragma mark - Main thread

- (BOOL)hasTemplate
{
  if (!_prepared) {
    return NO;
  }
  dispatch_group_wait(_prepared, dispatch_time(DISPATCH_TIME_NOW, 50 * NSEC_PER_MSEC));
  return _preparedRoot != nullptr || _containerView != nil;
}

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
