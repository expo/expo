#import "EXDevelopmentClient.h"

#import <REact/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTDevMenu.h>
#import <React/RCTAsyncLocalStorage.h>

#import <EDUMModuleRegistryAdapter.h>

#import "EXDevelopmentClientBundle.h"

//#if __has_include("EXDevMenu.h") // NOTE: Replace with working discovery of `EXDevMenu`
@import EXDevMenu;
#define HAVE_EX_DEV_MENU
//#endif

// Uncomment the below and set it to a React Native bundler URL to develop the launcher JS
//#define DEV_LAUNCHER_URL "http://10.0.0.176:8090/index.bundle?platform=ios&dev=true&minify=false"


NSString *fakeLauncherBundleUrl = @"embedded://exdevelopmentclient/dummy";


//
// EXDevelopmentClientBundleSource
//

@interface EXDevelopmentClientBundleSource : RCTSource
{
@public
  NSURL *_url;
  NSData *_data;
  NSUInteger _length;
  NSInteger _filesChangedCount;
}

@end

@implementation EXDevelopmentClientBundleSource

static EXDevelopmentClientBundleSource *
EXDevelopmentClientBundleSourceCreate(NSURL *url, NSData *data, int64_t length) NS_RETURNS_RETAINED
{
  EXDevelopmentClientBundleSource *source = [[EXDevelopmentClientBundleSource alloc] init];
  source->_url = url;
  source->_data = data;
  source->_length = length;
  source->_filesChangedCount = RCTSourceFilesChangedCountNotBuiltByBundler;
  return source;
}

- (NSURL *)url {
  return self->_url;
}

- (NSData *)data {
  return self->_data;
}

- (NSUInteger)length {
  return self->_length;
}

- (NSInteger)filesChangedCount {
  return self->_filesChangedCount;
}

@end


//
// EXDevelopmentClientController
//

@interface EXDevelopmentClientController ()

@property (nonatomic, weak) UIWindow *window;
@property (nonatomic, weak) id <EXDevelopmentClientControllerDelegate> delegate;
@property (nonatomic, strong) NSDictionary *launchOptions;
@property (nonatomic, strong) NSURL *sourceUrl;
@property (nonatomic, strong) RCTBridge *launcherBridge;
@property (nonatomic, strong) EDUMModuleRegistryAdapter *moduleRegistryAdapter;

@end

@implementation EXDevelopmentClientController

+ (instancetype)sharedInstance
{
  static EXDevelopmentClientController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [[EXDevelopmentClientController alloc] init];
    }
  });
  return theController;
}

- (instancetype)init {
  if (self = [super init]) {
    self.moduleRegistryAdapter = [[EDUMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[EDUMModuleRegistryProvider alloc] init]];
  }
  return self;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge];
  // You can inject any extra modules that you would like here, more information at:
  // https://facebook.github.io/react-native/docs/native-modules-ios.html#dependency-injection
  return [extraModules arrayByAddingObjectsFromArray:@[
    [[RCTDevMenu alloc] init],
    [[RCTAsyncLocalStorage alloc] init],
  ]];
}

#ifdef DEV_LAUNCHER_URL

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  // LAN url for developing launcher JS
  return [NSURL URLWithString:@(DEV_LAUNCHER_URL)];
}

#else

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [NSURL URLWithString:fakeLauncherBundleUrl];
}

- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback
{
  NSData *data = [NSData dataWithBytesNoCopy:EXDevelopmentClientBundle
                                      length:EXDevelopmentClientBundleLength
                                freeWhenDone:NO];
  loadCallback(nil, EXDevelopmentClientBundleSourceCreate([NSURL URLWithString:fakeLauncherBundleUrl],
                                                          data,
                                                          EXDevelopmentClientBundleLength));
}

#endif

- (void)startWithWindow:(UIWindow *)window delegate:(id<EXDevelopmentClientControllerDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  self.delegate = delegate;
  self.launchOptions = launchOptions;
  self.window = window;

  [self navigateToLauncher];
}

- (void)navigateToLauncher {
  self.launcherBridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.launcherBridge
                                                   moduleName:@"main"
                                            initialProperties:nil];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
}

@end


//
// EXDevelopmentClient
//

@implementation EXDevelopmentClient

RCT_EXPORT_MODULE()

- (instancetype)init {
  if (self = [super init]) {
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  if (UIInterfaceOrientationMaskPortrait & orientationMask) {
    return UIInterfaceOrientationPortrait;
  } else if (UIInterfaceOrientationMaskLandscapeLeft & orientationMask) {
    return UIInterfaceOrientationLandscapeLeft;
  } else if (UIInterfaceOrientationMaskLandscapeRight & orientationMask) {
    return UIInterfaceOrientationLandscapeRight;
  } else if (UIInterfaceOrientationMaskPortraitUpsideDown & orientationMask) {
    return UIInterfaceOrientationPortraitUpsideDown;
  }
  return UIInterfaceOrientationUnknown;
}

RCT_EXPORT_METHOD(loadApp:(NSURL *)url
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  UIInterfaceOrientationMask orientationMask = UIInterfaceOrientationMaskAll;
  if ([@"portrait" isEqualToString:options[@"orientation"]]) {
    orientationMask = UIInterfaceOrientationMaskPortrait;
  } else if ([@"landscape" isEqualToString:options[@"orientation"]]) {
    orientationMask = UIInterfaceOrientationMaskLandscape;
  }
  UIInterfaceOrientation orientation = [EXDevelopmentClient defaultOrientationForOrientationMask:orientationMask];

  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIDevice currentDevice] setValue:@(orientation) forKey:@"orientation"];
    [UIViewController attemptRotationToDeviceOrientation];

    EXDevelopmentClientController *controller = [EXDevelopmentClientController sharedInstance];
    controller.sourceUrl = url;
    [controller.delegate developmentClientController:controller didStartWithSuccess:YES];
  });
  resolve(nil);
}

@end


//
// EXDevelopmentClientDevMenuExtensions
//

#ifdef HAVE_EX_DEV_MENU

@interface EXDevelopmentClientDevMenuExtensions : NSObject <RCTBridgeModule, DevMenuExtensionProtocol>

@end

@implementation EXDevelopmentClientDevMenuExtensions

// Need to explicitly define `moduleName` here for dev menu to pick it up
RCT_EXTERN void RCTRegisterModule(Class);
+(NSString *)moduleName
{
  return @"ExpoDevelopmentClientDevMenuExtensions";
}
+(void)load
{
  RCTRegisterModule(self);
}

- (instancetype)init {
  if (self = [super init]) {
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

-(NSArray<DevMenuItem *> *)devMenuItems {
  DevMenuAction *backToLauncher = [[DevMenuAction alloc] initWithId:@"backToLauncher" action:^{
    dispatch_async(dispatch_get_main_queue(), ^{
      EXDevelopmentClientController *controller = [EXDevelopmentClientController sharedInstance];
      [controller navigateToLauncher];
    });
  }];
  backToLauncher.label = ^{ return @"Back to launcher"; };
  backToLauncher.glyphName = ^{ return @"exit-to-app"; };
  backToLauncher.importance = DevMenuItemImportanceHigh;

  return @[backToLauncher];
}

@end

#endif

