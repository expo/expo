// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelDevMenuViewController.h"
#import "EXBuildConstants.h"
#import "EXFileDownloader.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXKernelReactAppManager.h"
#import "EXKernelUtil.h"

#import <React/RCTBridge.h>

NSString * const kEXSkipCacheUserDefaultsKey = @"EXSkipCacheUserDefaultsKey";

@interface EXKernelDevMenuViewController ()

@property (nonatomic, strong) UINavigationBar *vTitleBar;
@property (nonatomic, strong) UIButton *btnDevMenu;
@property (nonatomic, strong) UIButton *btnResetNux;
@property (nonatomic, strong) UILabel *lblKernelHeading;
@property (nonatomic, strong) UILabel *lblKernelInfo;
@property (nonatomic, strong) UILabel *lblCacheHeading;
@property (nonatomic, strong) UILabel *lblCacheInfo;
@property (nonatomic, strong) UILabel *lblIsDevKernel;
@property (nonatomic, strong) UILabel *lblUseCache;
@property (nonatomic, strong) UISwitch *vUseCache;

- (void)_onTapCancel;
- (void)_onTapDevMenu;

@end

@implementation EXKernelDevMenuViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor whiteColor];
  self.navigationItem.title = @"Dev Menu";
  
  // title bar
  self.vTitleBar = [[UINavigationBar alloc] init];
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
  
  // cache info heading
  self.lblCacheHeading = [[UILabel alloc] init];
  _lblCacheHeading.text = @"Kernel JS Cache Source";
  [self.view addSubview:_lblCacheHeading];
  
  // cache info label
  self.lblCacheInfo = [[UILabel alloc] init];
  [self.view addSubview:_lblCacheInfo];
  
  // use cache label
  self.lblUseCache = [[UILabel alloc] init];
  _lblUseCache.text = @"Use kernel cache for prod kernel?";
  [self.view addSubview:_lblUseCache];
  
  // use cache switch
  _vUseCache = [[UISwitch alloc] init];
  [_vUseCache addTarget:self action:@selector(_handleUseCacheChanged:) forControlEvents:UIControlEventValueChanged];
  [self.view addSubview:_vUseCache];
  
  for (UIButton *btn in @[ _btnDevMenu, _btnResetNux ]) {
    btn.layer.cornerRadius = 3.0f;
    btn.backgroundColor = [UIColor colorWithWhite:0.9f alpha:1.0f];
  }
  
  for (UILabel *lbl in @[ _lblKernelHeading, _lblIsDevKernel, _lblCacheHeading, _lblUseCache ]) {
    lbl.font = [UIFont boldSystemFontOfSize:10.0f];
    lbl.textColor = [UIColor blackColor];
  }
  for (UILabel *lbl in @[ _lblKernelInfo, _lblCacheInfo ]) {
    lbl.numberOfLines = 0;
    lbl.font = [UIFont systemFontOfSize:10.0f];
    lbl.textColor = [UIColor grayColor];
  }
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  _vTitleBar.frame = CGRectMake(0, 0, self.view.frame.size.width, 64.0f);
  
  _lblKernelHeading.frame = CGRectMake(16.0f, CGRectGetMaxY(_vTitleBar.frame) + 16.0f, self.view.bounds.size.width - 32.0f, 18.0f);
  _lblKernelInfo.frame = CGRectMake(0, 0, _lblKernelHeading.bounds.size.width, CGFLOAT_MAX);
  [_lblKernelInfo sizeToFit];
  _lblKernelInfo.frame = CGRectMake(_lblKernelHeading.frame.origin.x, CGRectGetMaxY(_lblKernelHeading.frame) + 6.0f, _lblKernelInfo.bounds.size.width, _lblKernelInfo.bounds.size.height);
  
  _lblIsDevKernel.frame = CGRectMake(_lblKernelHeading.frame.origin.x, CGRectGetMaxY(_lblKernelInfo.frame) + 16.0f, _lblKernelHeading.bounds.size.width, _lblKernelHeading.bounds.size.height);

  _lblCacheHeading.frame = CGRectMake(_lblKernelHeading.frame.origin.x, CGRectGetMaxY(_lblIsDevKernel.frame) + 8.0f, _lblKernelHeading.bounds.size.width, _lblKernelHeading.bounds.size.height);
  _lblCacheInfo.frame = CGRectMake(0, 0, _lblCacheHeading.bounds.size.width, CGFLOAT_MAX);
  [_lblCacheInfo sizeToFit];
  _lblCacheInfo.frame = CGRectMake(_lblCacheHeading.frame.origin.x, CGRectGetMaxY(_lblCacheHeading.frame) + 6.0f, _lblCacheInfo.bounds.size.width, _lblCacheInfo.bounds.size.height);
  
  _vUseCache.center = CGPointMake(_lblCacheInfo.frame.origin.x + _vUseCache.bounds.size.width * 0.5f, CGRectGetMaxY(_lblCacheInfo.frame) + _vUseCache.bounds.size.height * 0.5f + 8.0f);
  _lblUseCache.frame = CGRectMake(CGRectGetMaxX(_vUseCache.frame) + 4.0f, _vUseCache.frame.origin.y, self.view.bounds.size.width, _vUseCache.frame.size.height);
  
  _btnDevMenu.frame = CGRectMake(0, 0, _lblKernelHeading.bounds.size.width, 36.0f);
  _btnDevMenu.center = CGPointMake(CGRectGetMidX(self.view.bounds), CGRectGetMaxY(_vUseCache.frame) + 42.0f);

  _btnResetNux.frame = CGRectMake(0, 0, _btnDevMenu.bounds.size.width, _btnDevMenu.bounds.size.height);
  _btnResetNux.center = CGPointMake(CGRectGetMidX(self.view.bounds), CGRectGetMaxY(_btnDevMenu.frame) + 30.0f);
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];
  RCTBridge *kernelBridge = [EXKernel sharedInstance].bridgeRegistry.kernelAppManager.reactBridge;
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
    EXKernelReactAppManager *appMgr = [EXKernel sharedInstance].bridgeRegistry.kernelAppManager;
    [appMgr showDevMenu];
  }];
}

- (void)_onTapResetNux
{
  [[EXKernel sharedInstance] dispatchKernelJSEvent:@"resetNuxState" body:@{ @"isNuxCompleted": @NO } onSuccess:nil onFailure:nil];
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
  [self _populateCacheInfoLabel];
  BOOL skipCache = [[NSUserDefaults standardUserDefaults] boolForKey:kEXSkipCacheUserDefaultsKey];
  _vUseCache.on = !skipCache;
}

- (void)_populateKernelInfoLabel
{
  NSURL *kernelUrl = [EXKernelReactAppManager kernelBundleUrl];
  _lblKernelInfo.text = (kernelUrl) ? kernelUrl.absoluteString : @"";

  NSMutableURLRequest *kernelReq = [NSMutableURLRequest requestWithURL:kernelUrl];
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

- (void)_populateCacheInfoLabel
{
  // the actual logic for downloading the kernel JS lives in EXKernelReactAppManager and EXJavaScriptLoader;
  // we just provide diagnostics on it here
  
  if ([EXBuildConstants sharedInstance].isDevKernel) {
    _lblCacheInfo.text = @"No cache is used when developing the kernel, though one may exist.";
  } else {
    NSURL *dummyUrl = [NSURL URLWithString:@""]; // we're just making this for diagnostic purposes and won't download anything here
    EXJavaScriptResource *dummyResource = [[EXJavaScriptResource alloc] initWithBundleName:kEXKernelBundleResourceName
                                                                                 remoteUrl:dummyUrl
                                                                           devToolsEnabled:NO];
    NSString *localBundlePath = [dummyResource resourceLocalPathPreferringCache];
    NSDate *dtmBundleModified;
    
    if (localBundlePath) {
      if ([[NSFileManager defaultManager] fileExistsAtPath:localBundlePath isDirectory:nil]) {
        NSURL *fileUrl = [NSURL fileURLWithPath:localBundlePath];
        NSError *err;
        [fileUrl getResourceValue:&dtmBundleModified forKey:NSURLContentModificationDateKey error:&err];
        if (err) {
          dtmBundleModified = nil;
        }
      } else {
        localBundlePath = nil;
      }
    }
    
    if (localBundlePath) {
      _lblCacheInfo.text = localBundlePath;
      if (dtmBundleModified) {
        NSString *dateString = [NSString stringWithFormat:@"\n\nCache modified: %@",
                                [NSDateFormatter localizedStringFromDate:dtmBundleModified
                                                               dateStyle:NSDateFormatterShortStyle
                                                               timeStyle:NSDateFormatterFullStyle]];
        _lblCacheInfo.text = [_lblCacheInfo.text stringByAppendingString:dateString];
      }
    } else {
      _lblCacheInfo.text = @"No local cache exists";
    }
  }
  [self.view setNeedsLayout];
}

#pragma mark - Listeners

- (void)_handleKernelLoadEvent:(__unused NSNotification *)notif
{
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf _populateContent];
  });
}

- (void)_handleUseCacheChanged:(id)sender
{
  [[NSUserDefaults standardUserDefaults] setBool:!_vUseCache.isOn forKey:kEXSkipCacheUserDefaultsKey];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

@end
