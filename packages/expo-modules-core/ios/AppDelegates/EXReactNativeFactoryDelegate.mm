#import <ExpoModulesCore/EXReactNativeFactoryDelegate.h>

#if RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTTurboModulePlugin/RCTTurboModulePlugin.h>
#else
#import <React/CoreModulesPlugins.h>
#endif

#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#import <react/nativemodule/defaults/DefaultTurboModules.h>

@implementation EXReactNativeFactoryDelegate

#pragma mark - RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
#if RN_DISABLE_OSS_PLUGIN_HEADER
  return RCTTurboModulePluginClassProvider(name);
#else
  return RCTCoreModulesClassProvider(name);
#endif
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return facebook::react::DefaultTurboModules::getTurboModule(name, jsInvoker);
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass, self.dependencyProvider);
}

- (nonnull UIView *)recreateRootViewWithBundleURL:(nullable NSURL *)bundleURL
                                       moduleName:(nullable NSString *)moduleName
                                     initialProps:(nullable NSDictionary *)initialProps
                                    launchOptions:(nullable NSDictionary *)launchOptions {
  RCTFatal(RCTErrorWithMessage(@"EXReactNativeFactoryDelegate - recreateRootViewWithBundleURL should be overridden and implemented!"));
  return nil;
}

@end
