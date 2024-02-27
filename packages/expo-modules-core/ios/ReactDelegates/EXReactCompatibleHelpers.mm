// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactCompatibleHelpers.h>

#import <React/RCTRootView.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

#if __has_include(<React-RCTAppDelegate/RCTAppSetupUtils.h>)
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppSetupUtils.h>
#endif

#if RCT_NEW_ARCH_ENABLED

#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>

#endif

UIView *EXAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary * _Nullable initialProperties, BOOL fabricEnabled)
{
  // TODO: Keeps this for later bridgeless integration to create the `RCTSurfaceHostingProxyRootView`

  return RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties, fabricEnabled);
}

UIView *EXCreateReactBindingRootView(id<RCTBridgeDelegate> _Nullable bridgeDelegate, NSDictionary * _Nullable initialProperties, NSDictionary * _Nullable launchOptions)
{
  UIApplication *application = UIApplication.sharedApplication;
  id delegate = application.delegate;
  if (![delegate isKindOfClass:RCTAppDelegate.class]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"The UIApplicationDelegate is a RCTAppDelegate."
                                 userInfo:nil];
  }
  RCTAppDelegate *appDelegate = (RCTAppDelegate *)delegate;

  BOOL enableTM = NO;
  BOOL fabricEnabled = NO;
#if RCT_NEW_ARCH_ENABLED
  enableTM = appDelegate.turboModuleEnabled;
  fabricEnabled = appDelegate.fabricEnabled;
#endif

  RCTAppSetupPrepareApp(application, enableTM);

  appDelegate.bridge = [[RCTBridge alloc] initWithDelegate:(bridgeDelegate != nil ? bridgeDelegate : appDelegate)
                                             launchOptions:launchOptions];

#if RCT_NEW_ARCH_ENABLED
  appDelegate.bridgeAdapter.bridge = appDelegate.bridge;
  appDelegate.bridge.surfacePresenter = appDelegate.bridgeAdapter.surfacePresenter;
#endif

  return EXAppSetupDefaultRootView(appDelegate.bridge, appDelegate.moduleName, initialProperties, fabricEnabled);
}
