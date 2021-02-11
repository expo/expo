// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKWebDialogView.h"

 #import <WebKit/WebKit.h>

 #import "FBSDKCloseIcon.h"
 #import "FBSDKError.h"
 #import "FBSDKInternalUtility.h"

 #define FBSDK_WEB_DIALOG_VIEW_BORDER_WIDTH 10.0

@interface FBSDKWebDialogView () <WKNavigationDelegate>
@end

@implementation FBSDKWebDialogView
{
  UIButton *_closeButton;
  UIActivityIndicatorView *_loadingView;
  WKWebView *_webView;
}

 #pragma mark - Object Lifecycle

 #pragma clang diagnostic push
 #pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    self.backgroundColor = [UIColor clearColor];
    self.opaque = NO;

    _webView = [[WKWebView alloc] initWithFrame:CGRectZero];
    _webView.navigationDelegate = self;
    [self addSubview:_webView];

    _closeButton = [UIButton buttonWithType:UIButtonTypeCustom];
    UIImage *closeImage = [[[FBSDKCloseIcon alloc] init] imageWithSize:CGSizeMake(29.0, 29.0)];
    [_closeButton setImage:closeImage forState:UIControlStateNormal];
    [_closeButton setTitleColor:[UIColor colorWithRed:167.0 / 255.0
                                                green:184.0 / 255.0
                                                 blue:216.0 / 255.0
                                                alpha:1.0] forState:UIControlStateNormal];
    [_closeButton setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
    _closeButton.showsTouchWhenHighlighted = YES;
    [_closeButton sizeToFit];
    [self addSubview:_closeButton];
    [_closeButton addTarget:self action:@selector(_close:) forControlEvents:UIControlEventTouchUpInside];

    _loadingView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
    _loadingView.color = [UIColor grayColor];
    [_webView addSubview:_loadingView];
  }
  return self;
}

 #pragma clang diagnostic pop

- (void)dealloc
{
  _webView.navigationDelegate = nil;
}

 #pragma mark - Public Methods

- (void)loadURL:(NSURL *)URL
{
  [_loadingView startAnimating];
  [_webView loadRequest:[NSURLRequest requestWithURL:URL]];
}

- (void)stopLoading
{
  [_webView stopLoading];
}

 #pragma mark - Layout

- (void)drawRect:(CGRect)rect
{
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextSaveGState(context);
  [self.backgroundColor setFill];
  CGContextFillRect(context, self.bounds);
  [[UIColor blackColor] setStroke];
  CGContextSetLineWidth(context, 1.0 / self.layer.contentsScale);
  CGContextStrokeRect(context, _webView.frame);
  CGContextRestoreGState(context);
  [super drawRect:rect];
}

 #pragma clang diagnostic push
 #pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (void)layoutSubviews
{
  [super layoutSubviews];

  CGRect bounds = self.bounds;
  if (UIDevice.currentDevice.userInterfaceIdiom == UIUserInterfaceIdiomPad) {
    CGFloat horizontalInset = CGRectGetWidth(bounds) * 0.2;
    CGFloat verticalInset = CGRectGetHeight(bounds) * 0.2;
    UIEdgeInsets iPadInsets = UIEdgeInsetsMake(verticalInset, horizontalInset, verticalInset, horizontalInset);
    bounds = UIEdgeInsetsInsetRect(bounds, iPadInsets);
  }
  UIEdgeInsets webViewInsets = UIEdgeInsetsMake(
    FBSDK_WEB_DIALOG_VIEW_BORDER_WIDTH,
    FBSDK_WEB_DIALOG_VIEW_BORDER_WIDTH,
    FBSDK_WEB_DIALOG_VIEW_BORDER_WIDTH,
    FBSDK_WEB_DIALOG_VIEW_BORDER_WIDTH
  );
  _webView.frame = CGRectIntegral(UIEdgeInsetsInsetRect(bounds, webViewInsets));

  CGRect webViewBounds = _webView.bounds;
  _loadingView.center = CGPointMake(CGRectGetMidX(webViewBounds), CGRectGetMidY(webViewBounds));

  if (CGRectGetHeight(webViewBounds) == 0.0) {
    _closeButton.alpha = 0.0;
  } else {
    _closeButton.alpha = 1.0;
    CGRect closeButtonFrame = _closeButton.bounds;
    closeButtonFrame.origin = bounds.origin;
    _closeButton.frame = CGRectIntegral(closeButtonFrame);
  }
}

 #pragma clang diagnostic pop

 #pragma mark - Actions

- (void)_close:(id)sender
{
  [_delegate webDialogViewDidCancel:self];
}

 #pragma mark - WKNavigationDelegate

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error
{
  [_loadingView stopAnimating];

  // 102 == WebKitErrorFrameLoadInterruptedByPolicyChange
  // NSURLErrorCancelled == "Operation could not be completed", note NSURLErrorCancelled occurs when the user clicks
  // away before the page has completely loaded, if we find cases where we want this to result in dialog failure
  // (usually this just means quick-user), then we should add something more robust here to account for differences in
  // application needs
  if (!(([error.domain isEqualToString:NSURLErrorDomain] && error.code == NSURLErrorCancelled)
        || ([error.domain isEqualToString:@"WebKitErrorDomain"] && error.code == 102))) {
    [_delegate webDialogView:self didFailWithError:error];
  }
}

 #pragma clang diagnostic push
 #pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (void)                  webView:(WKWebView *)webView
  decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction
                  decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler
{
  NSURL *URL = navigationAction.request.URL;

  if ([URL.scheme isEqualToString:@"fbconnect"]) {
    NSMutableDictionary<NSString *, id> *parameters = [[FBSDKBasicUtility dictionaryWithQueryString:URL.query] mutableCopy];
    [parameters addEntriesFromDictionary:[FBSDKBasicUtility dictionaryWithQueryString:URL.fragment]];
    if ([URL.resourceSpecifier hasPrefix:@"//cancel"]) {
      NSInteger errorCode = [FBSDKTypeUtility integerValue:parameters[@"error_code"]];
      if (errorCode) {
        NSString *errorMessage = [FBSDKTypeUtility stringValue:parameters[@"error_msg"]];
        NSError *error = [FBSDKError errorWithCode:errorCode message:errorMessage];
        [_delegate webDialogView:self didFailWithError:error];
      } else {
        [_delegate webDialogViewDidCancel:self];
      }
    } else {
      [_delegate webDialogView:self didCompleteWithResults:parameters];
    }
    decisionHandler(WKNavigationActionPolicyCancel);
  } else if (navigationAction.navigationType == WKNavigationTypeLinkActivated) {
    [[UIApplication sharedApplication] openURL:URL];
    decisionHandler(WKNavigationActionPolicyCancel);
  } else {
    decisionHandler(WKNavigationActionPolicyAllow);
  }
}

 #pragma clang diagnostic pop

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation
{
  [_loadingView stopAnimating];
  [_delegate webDialogViewDidFinishLoad:self];
}

@end

#endif
