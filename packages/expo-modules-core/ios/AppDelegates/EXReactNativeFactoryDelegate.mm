#import "EXReactNativeFactoryDelegate.h"

#if RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTTurboModulePlugin/RCTTurboModulePlugin.h>
#else
#import <React/CoreModulesPlugins.h>
#endif

#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#import <react/nativemodule/defaults/DefaultTurboModules.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

@implementation EXReactNativeFactoryDelegate

- (instancetype) init {
  self = [super init];
  if (self != nil) {
    self.dependencyProvider = [[RCTAppDependencyProvider alloc] init];
  }
  return self;
}

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

@end
