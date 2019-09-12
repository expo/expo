
#import "EXMenuViewController.h"
#import "EXKernel.h"
#import "EXAppLoader.h"
#import "EXKernelAppRegistry.h"
#import "EXReactAppManager.h"
#import "EXUtil.h"
#import "EXScreenOrientationManager.h"

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
    [self _maybeRebuildRootView];
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor whiteColor];

  [self.view addSubview:_reactRootView];
}

- (UIRectEdge)edgesForExtendedLayout
{
  return UIRectEdgeNone;
}

- (BOOL)extendedLayoutIncludesOpaqueBars
{
  return YES;
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  _reactRootView.frame = CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height);
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];
  [self _maybeRebuildRootView];
  [self _updateMenuProps];
}

- (BOOL)shouldAutorotate
{
  return YES;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  return [[EXKernel sharedInstance].serviceRegistry.screenOrientationManager supportedInterfaceOrientationsForVisibleApp];
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
    self->_reactRootView.frame = self.view.bounds;
    self->_reactRootView.sizeFlexibility = RCTRootViewSizeFlexibilityWidthAndHeight;
    self->_reactRootView.appProperties = menuProps;
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

- (void)_maybeRebuildRootView
{
  if (!_reactRootView
      || _reactRootView.bridge != [self _homeReactBridge]) // this can happen if the home bridge restarted for some reason (e.g. due to an error)
  {
    if (_reactRootView) {
      [_reactRootView removeFromSuperview];
      _reactRootView = nil;
    }
    _hasCalledJSLoadedNotification = NO;
    _reactRootView = [[RCTRootView alloc] initWithBridge:[self _homeReactBridge] moduleName:@"HomeMenu" initialProperties:@{}];
    if ([self isViewLoaded]) {
      [self.view addSubview:_reactRootView];
      [self.view setNeedsLayout];
    }
  }
}

- (RCTBridge *)_homeReactBridge
{
  EXReactAppManager *mgr = [EXKernel sharedInstance].appRegistry.homeAppRecord.appManager;
  return mgr.reactBridge;
}

@end
