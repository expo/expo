// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXOAuthViewController.h"

@interface EXOAuthViewController () <UIWebViewDelegate>

@end

@implementation EXOAuthViewController
{
  UIStatusBarStyle _initialStatusBarStyle;
  UIWebView *_webView;
  UINavigationBar *_navBar;
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [[UIApplication sharedApplication] setStatusBarStyle: UIStatusBarStyleDefault animated:YES];
#pragma clang diagnostic pop
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [[UIApplication sharedApplication] setStatusBarStyle: _initialStatusBarStyle animated:YES];
#pragma clang diagnostic pop
}

- (void)viewDidLoad
{
  [super viewDidLoad];

  _initialStatusBarStyle = [UIApplication sharedApplication].statusBarStyle;

  _webView = [UIWebView new];

  _webView.delegate = self;
  _webView.backgroundColor = [UIColor whiteColor];
  [_webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:_url]]];
  [self.view addSubview:_webView];

  UIBarButtonItem *cancelItem = [[UIBarButtonItem alloc] initWithTitle:@"Cancel"
                                                                 style:UIBarButtonItemStylePlain
                                                                target:self
                                                                action:@selector(didPressCancel)];

  UINavigationItem *navigationItem = [[UINavigationItem alloc] initWithTitle:@""];
  navigationItem.leftBarButtonItem = cancelItem;

  _navBar = [UINavigationBar new];
  _navBar.items = @[navigationItem];
  [self.view addSubview: _navBar];
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];

  CGFloat navbarHeight = 44 + [UIApplication sharedApplication].statusBarFrame.size.height;

  _webView.frame = self.view.frame;
  _webView.scrollView.contentInset = UIEdgeInsetsMake(navbarHeight, 0, 0, 0);

  _navBar.frame = CGRectMake(0, 0, self.view.frame.size.width, navbarHeight);
}

-(BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType
{
  NSString *url = request.URL.absoluteString;
  if ([url hasPrefix:@"https://oauth.host.exp.com"]) {
    [_delegate oAuthViewControler:self didReceiveResult:url];
    return NO;
  }

  return YES;
}

-(void)didPressCancel
{
  [_delegate oAuthViewControlerDidCancel:self];
}

@end
