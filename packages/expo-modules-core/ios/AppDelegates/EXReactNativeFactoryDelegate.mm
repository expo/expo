#import "EXReactNativeFactoryDelegate.h"

#import "RCTDefaultReactNativeFactoryDelegate.h"
#import <ReactCommon/RCTHost.h>
#import "RCTAppSetupUtils.h"
#import "RCTDependencyProvider.h"

#import <react/nativemodule/defaults/DefaultTurboModules.h>

@interface EXReactNativeFactoryDelegate()

@property (nonatomic, copy) RCTReactNativeFactory *reactNativeFactory;

@end

@implementation EXReactNativeFactoryDelegate

- (instancetype)initWithFactory:(RCTReactNativeFactory*) reactNativeFactory {
  self.reactNativeFactory = reactNativeFactory;
  self = [super init];
  return self;
}

- (Class)getModuleClassFromName:(const char *)name
{
  return [self.reactNativeFactory getModuleClassFromName: name];
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass, self.delegate.dependencyProvider);
}

@end
