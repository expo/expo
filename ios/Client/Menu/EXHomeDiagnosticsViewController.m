// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXHomeDiagnosticsViewController.h"
#import "EXBuildConstants.h"
#import "EXFileDownloader.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXHomeAppManager.h"

#import <React/RCTBridge.h>

@interface EXHomeDiagnosticsViewController () <UINavigationBarDelegate>

@property (nonatomic, strong) UINavigationBar *vTitleBar;
@property (nonatomic, strong) UIButton *btnDevMenu;
@property (nonatomic, strong) UIButton *btnResetNux;
@property (nonatomic, strong) UILabel *lblKernelHeading;
@property (nonatomic, strong) UILabel *lblKernelInfo;
@property (nonatomic, strong) UILabel *lblIsDevKernel;

- (void)_onTapCancel;
- (void)_onTapDevMenu;

@end

@implementation EXHomeDiagnosticsViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor whiteColor];
  self.navigationItem.title = @"Home Diagnostics";
  
  // title bar
  self.vTitleBar = [[UINavigationBar alloc] init];
  _vTitleBar.delegate = self;
  self.navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemCancel target:self action:@selector(_onTapCancel)];
  _vTitleBar.items = @[ self.navigationItem ];
  [self.view addSubview:_vTitleBar];
  
  // RCTDevMenu button
  self.btnDevMenu = [UIButton buttonWithType:UIButtonTypeSystem];
  [_btnDevMenu setTitle:@"Show RCTDevMenu" forState:UIControlStateNormal];
  [_btnDevMenu addTarget:self action:@selector(_onTapDevMenu) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:_btnDevMenu];
  
  // reset nux button
  self.btnResetNux = [UIButton buttonWithType:UIButtonTypeSystem];
  [_btnResetNux setTitle:@"Reset NUX" forState:UIControlStateNormal];
  [_btnResetNux addTarget:self action:@selector(_onTapResetNux) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:_btnResetNux];
  
  // kernel info heading
  self.lblKernelHeading = [[UILabel alloc] init];
  _lblKernelHeading.text = @"Kernel HTTP Source";
  [self.view addSubview:_lblKernelHeading];
  
  // kernel info label
  self.lblKernelInfo = [[UILabel alloc] init];
  [self.view addSubview:_lblKernelInfo];
  
  // dev kernel label
  self.lblIsDevKernel = [[UILabel alloc] init];
  [self.view addSubview:_lblIsDevKernel];
  
  for (UIButton *btn in @[ _btnDevMenu, _btnResetNux ]) {
    btn.layer.cornerRadius = 3.0f;
    btn.backgroundColor = [UIColor colorWithWhite:0.9f alpha:1.0f];
  }
  
  for (UILabel *lbl in @[ _lblKernelHeading, _lblIsDevKernel ]) {
    lbl.font = [UIFont boldSystemFontOfSize:10.0f];
    lbl.textColor = [UIColor blackColor];
  }
  for (UILabel *lbl in @[ _lblKernelInfo ]) {
    lbl.numberOfLines = 0;
    lbl.font = [UIFont systemFontOfSize:10.0f];
    lbl.textColor = [UIColor grayColor];
  }
}

- (UIRectEdge) edgesForExtendedLayout
{
  return UIRectEdgeNone;
}

- (UIBarPosition)positionForBar:(__unused id<UIBarPositioning>)bar
{
  return UIBarPositionTopAttached;
}

- (BOOL)extendedLayoutIncludesOpaqueBars
{
  return YES;
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  _vTitleBar.frame = CGRectMake(0.0f, 40.0f, self.view.frame.size.width, 64.0f);
  
  _lblKernelHeading.frame = CGRectMake(16.0f, CGRectGetMaxY(_vTitleBar.frame) + 12.0f, self.view.bounds.size.width - 32.0f, 18.0f);
  _lblKernelInfo.frame = CGRectMake(0, 0, _lblKernelHeading.bounds.size.width, CGFLOAT_MAX);
  [_lblKernelInfo sizeToFit];
  _lblKernelInfo.frame = CGRectMake(_lblKernelHeading.frame.origin.x, CGRectGetMaxY(_lblKernelHeading.frame) + 6.0f, _lblKernelInfo.bounds.size.width, _lblKernelInfo.bounds.size.height);
  
  _lblIsDevKernel.frame = CGRectMake(_lblKernelHeading.frame.origin.x, CGRectGetMaxY(_lblKernelInfo.frame) + 12.0f, _lblKernelHeading.bounds.size.width, _lblKernelHeading.bounds.size.height);

  _btnDevMenu.frame = CGRectMake(0, 0, _lblKernelHeading.bounds.size.width, 36.0f);
  _btnDevMenu.center = CGPointMake(CGRectGetMidX(self.view.bounds), CGRectGetMaxY(_lblIsDevKernel.frame) + 42.0f);

  _btnResetNux.frame = CGRectMake(0, 0, _btnDevMenu.bounds.size.width, _btnDevMenu.bounds.size.height);
  _btnResetNux.center = CGPointMake(CGRectGetMidX(self.view.bounds), CGRectGetMaxY(_btnDevMenu.frame) + 30.0f);
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];
  RCTBridge *kernelBridge = [EXKernel sharedInstance].appRegistry.homeAppRecord.appManager.reactBridge;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleKernelLoadEvent:)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:kernelBridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleKernelLoadEvent:)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:kernelBridge];
  [self _populateContent];
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}


#pragma mark - Actions

- (void)_onTapDevMenu
{
  [self dismissViewControllerAnimated:YES completion:^{
    EXReactAppManager *appMgr = [EXKernel sharedInstance].appRegistry.homeAppRecord.appManager;
    [appMgr showDevMenu];
  }];
}

- (void)_onTapResetNux
{
  if ([EXKernel sharedInstance].browserController) {
    [[EXKernel sharedInstance].browserController setIsNuxFinished:NO];
  }
  [self dismissViewControllerAnimated:YES completion:nil];
}

- (void)_onTapCancel
{
  [self dismissViewControllerAnimated:YES completion:nil];
}

- (void)_populateContent
{
  EXAssertMainThread();
  [self _populateKernelInfoLabel];
  [self _populateDevKernelLabel];
}

- (void)_populateKernelInfoLabel
{
  NSString *kernelUrl = [[EXHomeAppManager bundledHomeManifest] objectForKey:@"bundleUrl"];
  _lblKernelInfo.text = kernelUrl;

  NSMutableURLRequest *kernelReq = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:kernelUrl]];
  EXFileDownloader *downloader = [[EXFileDownloader alloc] init];
  [downloader setHTTPHeaderFields:kernelReq];
  NSString *headerString = [kernelReq allHTTPHeaderFields].description;
  _lblKernelInfo.text = [_lblKernelInfo.text stringByAppendingString:[NSString stringWithFormat:@"\n\n%@", headerString]];

  [self.view setNeedsLayout];
}

- (void)_populateDevKernelLabel
{
  BOOL isDevKernel = [EXBuildConstants sharedInstance].isDevKernel;
  _lblIsDevKernel.text = [NSString stringWithFormat:@"Development kernel? %@", (isDevKernel) ? @"Yes" : @"No"];
}

#pragma mark - Listeners

- (void)_handleKernelLoadEvent:(__unused NSNotification *)notif
{
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf _populateContent];
  });
}

@end
