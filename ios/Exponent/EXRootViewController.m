// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXRootViewController.h"
#import "EXShellManager.h"
#import "RCTRootView.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController ()

@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicator;

@end

@implementation EXRootViewController

#pragma mark - Lifecycle

- (void)viewDidLoad
{
  [super viewDidLoad];

  // Display the launch screen behind the React view so that the React view appears to seamlessly load
  NSString *loadingNib = ([EXShellManager sharedInstance].isShell) ? @"LaunchScreenShell" : @"LaunchScreen";
  NSArray *views = [[NSBundle mainBundle] loadNibNamed:loadingNib owner:self options:nil];
  UIView *placeholder = views.firstObject;
  placeholder.frame = self.view.bounds;
  placeholder.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self.view addSubview:placeholder];
  
  // The launch screen contains a loading indicator
  // use this instead of the superclass loading indicator
  _loadingIndicator = (UIActivityIndicatorView *)[placeholder viewWithTag:1];
}

#pragma mark - Public

- (void)applicationWillEnterForeground
{
  if (!self.isLoading && ![self.contentView isKindOfClass:[RCTRootView class]]) {
    [self loadReactApplication];
  }
}

#pragma mark - Internal

- (void)setIsLoading:(BOOL)isLoading
{
  // don't call super

  if (isLoading) {
    [_loadingIndicator startAnimating];
  } else {
    [_loadingIndicator stopAnimating];
  }
}

@end

NS_ASSUME_NONNULL_END
