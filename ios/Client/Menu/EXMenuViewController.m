
#import "EXMenuViewController.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
#import "EXKernelAppRegistry.h"
#import "EXReactAppManager.h"
#import "EXUtil.h"

#import <React/RCTRootView.h>

@interface EXMenuViewController ()

@property (nonatomic, strong) RCTRootView *reactRootView;
@property (nonatomic, assign) BOOL hasCalledJSLoadedNotification;

@end

@interface RCTRootView (EXMenuView)

- (void)javaScriptDidLoad:(NSNotification *)notification;
- (void)hideLoadingView;

@end

@implementation EXMenuViewController

- (instancetype)init
{
  if (self = [super init]) {
    _hasCalledJSLoadedNotification = NO;
    _reactRootView = [[RCTRootView alloc] initWithBridge:[self _homeReactBridge] moduleName:@"HomeMenu" initialProperties:@{}];
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor whiteColor];
  self.edgesForExtendedLayout = UIRectEdgeNone;

  [self.view addSubview:_reactRootView];
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  _reactRootView.frame = self.view.bounds;
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];
  [self _updateMenuProps];
}

#pragma mark - internal

- (void)_updateMenuProps
{
  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  NSDictionary *task = @{
    @"manifestUrl": visibleApp.appLoader.manifestUrl.absoluteString,
    @"manifest": (visibleApp.appLoader.manifest) ? visibleApp.appLoader.manifest : [NSNull null],
  };
  // include randomness to force the component to rerender
  NSDictionary *menuProps = @{ @"task": task, @"uuid": [[NSUUID UUID] UUIDString] };
  [EXUtil performSynchronouslyOnMainThread:^{
    [self _forceRootViewToRenderHack];
    _reactRootView.frame = self.view.bounds;
    _reactRootView.sizeFlexibility = RCTRootViewSizeFlexibilityWidthAndHeight;
    _reactRootView.appProperties = menuProps;
  }];
}

  // RCTRootView assumes it is created on a loading bridge.
  // in our case, the bridge has usually already loaded. so we need to prod the view.
- (void)_forceRootViewToRenderHack
{
  if (!_hasCalledJSLoadedNotification) {
    NSNotification *notif = [[NSNotification alloc] initWithName:RCTJavaScriptDidLoadNotification
                                                          object:nil
                                                        userInfo:@{ @"bridge": [self _homeReactBridge] }];
    [_reactRootView javaScriptDidLoad:notif];
    _hasCalledJSLoadedNotification = YES;
  }
}

- (RCTBridge *)_homeReactBridge
{
  EXReactAppManager *mgr = [EXKernel sharedInstance].appRegistry.homeAppRecord.appManager;
  return mgr.reactBridge;
}

@end
