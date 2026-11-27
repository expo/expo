// Copyright 2025-present 650 Industries. All rights reserved.

#import <Expo/ExpoReactNativeFactory.h>
#import <ExpoModulesCore/EXHostWrapper.h>

// When using xcframeworks, the generated Swift
// header is inside ExpoModulesCore module. Otherwise, it's available only
// locally with double-quoted imports.
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#elif __has_include("ExpoModulesCore-Swift.h")
#import "ExpoModulesCore-Swift.h"
#endif


#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
#import "ExpoModulesCore-Swift.h"
#endif
#import <ReactCommon/RCTHost.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#import <ExpoModulesCore/EXReactSchedulerDispatch.h>

@interface RCTReactNativeFactory (ThirdPartyFabricComponents) <RCTComponentViewFactoryComponentProvider>
@end

@implementation EXReactNativeFactory {
  EXAppContext *_appContext;
  __weak id<RCTComponentViewFactoryComponentProvider> _previousComponentsProvider;
}

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate releaseLevel:(RCTReleaseLevel)releaseLevel
{
  // The component view factory is global and keeps only the provider of the last factory.
  // Keep the earlier provider, so that the components of an earlier factory stay registered.
  id<RCTComponentViewFactoryComponentProvider> previousProvider =
      [RCTComponentViewFactory currentComponentViewFactory].thirdPartyFabricComponentsProvider;
  if (self = [super initWithDelegate:delegate releaseLevel:releaseLevel]) {
    _previousComponentsProvider = previousProvider;
  }
  return self;
}

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *components = [super thirdPartyFabricComponents];
  id<RCTComponentViewFactoryComponentProvider> previousProvider = _previousComponentsProvider;
  if (!previousProvider) {
    return components;
  }
  NSMutableDictionary<NSString *, Class<RCTComponentViewProtocol>> *merged =
      [NSMutableDictionary dictionaryWithDictionary:previousProvider.thirdPartyFabricComponents];
  [merged addEntriesFromDictionary:components];
  return merged;
}

#pragma mark - RCTHostDelegate

#if TARGET_OS_OSX
// TODO: remove when bumping react-native-macos to 0.85
- (void)hostDidStart:(nonnull RCTHost *)host
{
  host.runtimeDelegate = self;
}
#endif

// [JS thread]
- (void)host:(nonnull RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  // Bind this callback to the context it creates. The factory is created once in
  // `application:didFinishLaunchingWithOptions:` and outlives any single `RCTHost`,
  // so a reload can run this callback for the incoming host while the outgoing
  // host's callback is still in flight on its own JS thread. Reading the shared ivar
  // back after that point can hand this callback the other callback's context, and
  // decorating objects created for one Hermes runtime against another runtime's
  // `AppContext.runtime` faults inside JSI.
  EXAppContext *appContext = [[EXAppContext alloc] init];
  _appContext = appContext;

  // Resolve the React runtime scheduler so ExpoModulesJSI can dispatch work onto
  // the JS thread. Doing it here (rather than inside the xcframework) keeps
  // React-runtimescheduler symbols out of the prebuilt ExpoModulesJSI.framework.
  // That matters for source-built RN, where those symbols are hidden after link
  // and unreachable via -undefined dynamic_lookup.
  //
  // The handle references the scheduler weakly, so dispatching after the React
  // instance tore it down (e.g. on reload) drops the task instead of calling
  // into freed memory. See `EXReactSchedulerDispatch.h`.
  //
  // If RN didn't install a RuntimeSchedulerBinding for some reason, pass nullptr
  // for both. AppContext.setRuntime falls back to a synchronous no-op scheduler
  // so the app still launches; modules that require async dispatch can gate on
  // `JavaScriptRuntime.supportsAsyncScheduling`.
  auto binding = facebook::react::RuntimeSchedulerBinding::getBinding(runtime);
  auto scheduler = binding ? binding->getRuntimeScheduler() : nullptr;
  void *schedulerHandle = expo::createReactSchedulerHandle(scheduler);

  [appContext setRuntime:&runtime
               scheduler:schedulerHandle
                dispatch:schedulerHandle ? reinterpret_cast<const void *>(&expo::dispatchOnReactScheduler) : nullptr];
  [appContext setHostWrapper:[[EXHostWrapper alloc] initWithHost:host]];

  [appContext registerNativeModulesWithProvider:[EXAppContext modulesProviderWithName:@"ExpoModulesProvider" inImageOf:[EXReactNativeFactory class]]];
}

@end
