// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTRootView.h>
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#import <ExpoModulesCore/EXDefines.h>

#import "EXDevMenuViewController.h"
#import "EXDevMenuManager.h"
#import "EXKernel.h"
#import "EXAbstractLoader.h"
#import "EXKernelAppRegistry.h"
#import "EXUtil.h"
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import "EXManifests-Swift.h"

@interface EXDevMenuViewController ()

@property (nonatomic, strong) UIView *reactRootView;
@property (nonatomic, assign) BOOL hasCalledJSLoadedNotification;

@end

@interface RCTSurfaceHostingProxyRootView (EXDevMenuView)

- (void)javaScriptDidLoad:(NSNotification *)notification;
- (void)hideLoadingView;

@end

@implementation EXDevMenuViewController

# pragma mark - UIViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
  [self _rebuildRootView];
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
  [self _rebuildRootView];
  [_reactRootView becomeFirstResponder];
}

- (BOOL)shouldAutorotate
{
  return YES;
}

/**
 * Overrides UIViewController's method that returns interface orientations that the view controller supports.
 * If EXDevMenuViewController is currently shown we want to use its supported orientations so the UI rotates
 * when we open the dev menu while in the unsupported orientation.
 * Otherwise, returns interface orientations supported by the current experience.
 */
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  return UIInterfaceOrientationMaskPortrait;
}

/**
 * Same case as above with `supportedInterfaceOrientations` method.
 * If we don't override this, we can get incorrect orientation while changing device orientation when the dev menu is visible.
 */
- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
  return UIInterfaceOrientationPortrait;
}

#pragma mark - API



#pragma mark - internal

- (NSDictionary *)_getInitialPropsForVisibleApp
{
  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  NSString *manifestString = nil;
  EXManifestsManifest *manifest = visibleApp.appLoader.manifest;
  if (manifest && [NSJSONSerialization isValidJSONObject:manifest.rawManifestJSON]) {
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:manifest.rawManifestJSON options:0 error:&error];
    if (jsonData) {
      manifestString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    } else {
      EXLogWarn(@"Failed to serialize JSON manifest: %@", error);
    }
  }
  NSDictionary *task = @{
    @"manifestUrl": visibleApp.appLoader.manifestUrl.absoluteString,
    @"manifestString": manifestString ?: [NSNull null],
  };

  return @{
    @"task": task,
    @"uuid": [[NSUUID UUID] UUIDString], // include randomness to force the component to rerender
  };
}

- (void)_rebuildRootView
{
  RCTAppDelegate *mainAppDelegate = [[EXDevMenuManager sharedInstance] mainAppDelegate];

  if (_reactRootView) {
    [_reactRootView removeFromSuperview];
    _reactRootView = nil;
  }
  _hasCalledJSLoadedNotification = NO;
  
  _reactRootView =  [mainAppDelegate.rootViewFactory viewWithModuleName:@"HomeMenu" initialProperties:[self _getInitialPropsForVisibleApp]];

  // By default react root view has white background,
  // however devmenu's bottom sheet looks better with partially visible experience.
  _reactRootView.backgroundColor = [UIColor clearColor];

  if ([self isViewLoaded]) {
    [self.view addSubview:_reactRootView];
    [self.view setNeedsLayout];
  }
}

@end
