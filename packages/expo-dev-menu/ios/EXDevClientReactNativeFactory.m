//
//  EXDevClientReactNativeFactory.m
//  expo-dev-menu
//
//  Created by Vojtech Novak on 14.02.2025.
//

#import "EXDevClientReactNativeFactory.h"
#import <EXDevMenu/DevClientAppDelegate.h>
#import <EXDevMenu/DevClientRootViewFactory.h>

@implementation EXDevClientReactNativeFactory

- (RCTRootViewFactory *)internalCreateRCTRootViewFactory
{
  RCTRootViewFactoryConfiguration *configuration =
  [[RCTRootViewFactoryConfiguration alloc] initWithBundleURL:self.bundleURL
                                              newArchEnabled:self.fabricEnabled
                                          turboModuleEnabled:self.turboModuleEnabled
                                           bridgelessEnabled:self.bridgelessEnabled];

  __weak __typeof(self) weakSelf = self;

  configuration.createBridgeWithDelegate = ^RCTBridge *(id<RCTBridgeDelegate> bridge, NSDictionary *launchOptions)
  {
    return [weakSelf createBridgeWithDelegate:bridge launchOptions:launchOptions];
  };


  return [[DevClientRootViewFactory alloc] initWithConfiguration:configuration andTurboModuleManagerDelegate:self.delegate];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  // Since we defined this selector but pretend that we don't implement it,
  // we should also fallthrough moduleProvider case at
  // https://github.com/facebook/react-native/blob/fd0ca4dd6209d79ac8c93dbffac2e3dca1caeadc/packages/react-native/React/CxxBridge/RCTCxxBridge.mm#L774-L778
  RCTBridgeModuleListProvider moduleProvider = [bridge valueForKey:@"_moduleProvider"];
  if (moduleProvider) {
    return moduleProvider();
  }
  return @[];
}

- (BOOL)bridge:(RCTBridge *)bridge didNotFindModule:(NSString *)moduleName
{
  return NO;
}

@end
