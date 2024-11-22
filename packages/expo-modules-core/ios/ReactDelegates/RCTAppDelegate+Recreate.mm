// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/RCTAppDelegate+Recreate.h>

#import <ExpoModulesCore/EXReactRootViewFactory.h>

@implementation RCTAppDelegate (Recreate)

- (UIView *)recreateRootViewWithBundleURL:(nullable NSURL *)bundleURL
                               moduleName:(nullable NSString *)moduleName
                             initialProps:(nullable NSDictionary *)initialProps
                            launchOptions:(nullable NSDictionary *)launchOptions
{
  if (self.bridgelessEnabled) {
    id reactHost = self.rootViewFactory.reactHost;
    RCTAssert(reactHost == nil, @"recreateRootViewWithBundleURL: does not support when react instance is created");
  } else {
    RCTAssert(self.rootViewFactory.bridge == nil, @"recreateRootViewWithBundleURL: does not support when react instance is created");
  }

  RCTRootViewFactory *rootViewFactory = self.rootViewFactory;
  RCTRootViewFactoryConfiguration *configuration = [rootViewFactory valueForKey:@"_configuration"];
  if (bundleURL != nil) {
    configuration.bundleURLBlock = ^{
      return bundleURL;
    };
  }
  if (moduleName != nil) {
    self.moduleName = moduleName;
  }
  if (initialProps != nil) {
    self.initialProps = initialProps;
  }

  UIView *rootView;
  if ([rootViewFactory isKindOfClass:[EXReactRootViewFactory class]]) {
    // When calling `recreateRootViewWithBundleURL:` from `EXReactRootViewFactory`,
    // we don't want to loop the ReactDelegate again. Otherwise it will be infinite loop.
    EXReactRootViewFactory *factory = (EXReactRootViewFactory *)rootViewFactory;
    rootView = [factory superViewWithModuleName:self.moduleName initialProperties:self.initialProps launchOptions:launchOptions];
  } else {
    rootView = [rootViewFactory viewWithModuleName:self.moduleName initialProperties:self.initialProps launchOptions:launchOptions];
  }
  return rootView;
}

@end
