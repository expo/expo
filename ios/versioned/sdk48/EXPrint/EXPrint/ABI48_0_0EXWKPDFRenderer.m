// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXPrint/ABI48_0_0EXWKPDFRenderer.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXDefines.h>
#import <ABI48_0_0EXPrint/ABI48_0_0EXWKViewPrintPDFRenderer.h>

@interface ABI48_0_0EXWKPDFRenderer () <WKNavigationDelegate>

@property (nonatomic, assign) CGSize pageSize;
@property (nonatomic, assign) UIEdgeInsets pageMargins;
@property (nonatomic, strong) WKWebView *webView;
@property (nonatomic, strong) id<ABI48_0_0EXPDFRenderer> renderer;
@property (nonatomic, strong) WKNavigation *htmlNavigation;
@property (nonatomic, strong) void (^onRenderingFinished)(NSError * _Nullable, NSData * _Nullable, int);

@end

@implementation ABI48_0_0EXWKPDFRenderer

- (void)PDFWithHtml:(NSString *)htmlString pageSize:(CGSize)pageSize pageMargins:(UIEdgeInsets)pageMargins completionHandler:(void (^)(NSError * _Nullable, NSData * _Nullable, int))handler
{
  _pageSize = pageSize;
  _pageMargins = pageMargins;
  _onRenderingFinished = handler;
  _webView = [self createWebView];
  _renderer = [[ABI48_0_0EXWKViewPrintPDFRenderer alloc] initWithPageSize:pageSize pageMargins:pageMargins];
  _htmlNavigation = [_webView loadHTMLString:htmlString baseURL:[[NSBundle mainBundle] resourceURL]];
}

#pragma mark - UIWebViewDelegate

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation
{
  if (_htmlNavigation != navigation) {
    return;
  }

  ABI48_0_0EX_WEAKIFY(self);
  [_renderer PDFFromWebView:webView completionHandler:^(NSError * _Nullable error, NSData * _Nullable data, int pagesCount) {
    ABI48_0_0EX_ENSURE_STRONGIFY(self);
    self.onRenderingFinished(error, data, pagesCount);
  }];
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error
{
  if (_htmlNavigation != navigation) {
    return;
  }

  _onRenderingFinished(error, nil, 0);
}

- (WKWebView *)createWebView
{
  WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];
  CGRect frame = CGRectMake(0, 0, _pageSize.width, _pageSize.height);
  WKWebView *webView = [[WKWebView alloc] initWithFrame:frame configuration:configuration];
  webView.navigationDelegate = self;
  webView.backgroundColor = [UIColor clearColor];
  webView.scrollView.showsHorizontalScrollIndicator = NO;
  webView.scrollView.showsVerticalScrollIndicator = NO;

  return webView;
}

@end
