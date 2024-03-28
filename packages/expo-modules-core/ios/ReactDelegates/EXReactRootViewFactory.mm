// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactRootViewFactory.h>

#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <ReactCommon/RCTHost.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

@interface RCTAppDelegate () <RCTTurboModuleManagerDelegate>

@end

@interface RCTRootViewFactory () {
  RCTHost *_reactHost;
}

@property (nonatomic, strong, nullable) RCTHost *reactHost;
@end

@implementation EXReactRootViewFactory

- (instancetype)initWithReactDelegate:(nullable EXReactDelegateWrapper *)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
{
  if (self = [super initWithConfiguration:configuration andTurboModuleManagerDelegate:turboModuleManagerDelegate]) {
    self.reactDelegate = reactDelegate;
  }
  return self;
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties
                 launchOptions:(nullable NSDictionary *)launchOptions
{
  if (self.reactDelegate != nil) {
    return [self.reactDelegate createReactRootView:moduleName initialProperties:initialProperties launchOptions:launchOptions];
  }
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
}

+ (UIView *)createDefaultReactRootView:(nullable NSURL *)_bundleURL
                            moduleName:(nullable NSString *)_moduleName
                     initialProperties:(nullable NSDictionary *)_initialProperties
                         launchOptions:(nullable NSDictionary *)launchOptions
{
  RCTAppDelegate *appDelegate = [self getRCTAppDelegate];
  NSURL *bundleURL = _bundleURL ?: appDelegate.bundleURL;
  NSString *moduleName = _moduleName ?: appDelegate.moduleName;
  NSDictionary *initialProperties = _initialProperties ?: appDelegate.initialProps;

  if (![appDelegate.rootViewFactory isKindOfClass:EXReactRootViewFactory.class]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"The appDelegate.rootViewFactory must be an EXReactRootViewFactory instance."
                                 userInfo:nil];
  }
  EXReactRootViewFactory *appRootViewFactory = (EXReactRootViewFactory *)appDelegate.rootViewFactory;
  RCTRootViewFactoryConfiguration *appRootViewFactoryConfiguration = [appRootViewFactory valueForKey:@"_configuration"];

  RCTRootViewFactoryConfiguration *configuration =
  [[RCTRootViewFactoryConfiguration alloc] initWithBundleURL:bundleURL
                                              newArchEnabled:appDelegate.fabricEnabled
                                          turboModuleEnabled:appDelegate.turboModuleEnabled
                                           bridgelessEnabled:appDelegate.bridgelessEnabled];
  configuration.createRootViewWithBridge = appRootViewFactoryConfiguration.createRootViewWithBridge;
  configuration.createBridgeWithDelegate = appRootViewFactoryConfiguration.createBridgeWithDelegate;

  EXReactRootViewFactory *factory = [[EXReactRootViewFactory alloc] initWithConfiguration:configuration andTurboModuleManagerDelegate:appDelegate];
  UIView *rootView = [factory superViewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];

  // The RCTHost/RCTBridge instance is retained by the RCTRootViewFactory.
  // We will have to replace these instance from the app to the newly created instance.
  appDelegate.rootViewFactory = factory;
  
  return rootView;
}

/**
 Calls origin `viewWithModuleName:initialProperties:launchOptions:` from superview (`RCTRootViewFactory`).
 */
- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions
{
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
}

- (RCTHost *)reactHost
{
  return [self valueForKey:@"_reactHost"];
}

- (void)setReactHost:(RCTHost *)reactHost
{
  return [self setValue:reactHost forKey:@"_reactHost"];
}

+ (RCTAppDelegate *)getRCTAppDelegate
{
  UIApplication *application = UIApplication.sharedApplication;
  id delegate = application.delegate;
  if (![delegate isKindOfClass:RCTAppDelegate.class]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"The UIApplicationDelegate is a RCTAppDelegate."
                                 userInfo:nil];
  }
  return (RCTAppDelegate *)delegate;
}

@end
