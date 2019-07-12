#import "ABI34_0_0RNCUIWebView.h"

// #import <UIKit/UIKit.h>
#import <ReactABI34_0_0/ABI34_0_0RCTAutoInsetsProtocol.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventDispatcher.h>
#import <ReactABI34_0_0/ABI34_0_0RCTLog.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUtils.h>
#import <ReactABI34_0_0/ABI34_0_0RCTView.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>

NSString *const ABI34_0_0RNCJSNavigationScheme = @"ReactABI34_0_0-js-navigation";

static NSString *const MessageHandlerName = @"ReactABI34_0_0NativeWebView";

@interface ABI34_0_0RNCUIWebView () <UIWebViewDelegate, ABI34_0_0RCTAutoInsetsProtocol>

@property (nonatomic, copy) ABI34_0_0RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) ABI34_0_0RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) ABI34_0_0RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) ABI34_0_0RCTDirectEventBlock onShouldStartLoadWithRequest;
@property (nonatomic, copy) ABI34_0_0RCTDirectEventBlock onMessage;

@end

@implementation ABI34_0_0RNCUIWebView
{
  UIWebView *_webView;
  NSString *_injectedJavaScript;
}

- (void)dealloc
{
  _webView.delegate = nil;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    super.backgroundColor = [UIColor clearColor];
    _automaticallyAdjustContentInsets = YES;
    _contentInset = UIEdgeInsetsZero;
    _webView = [[UIWebView alloc] initWithFrame:self.bounds];
    _webView.delegate = self;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
    if ([_webView.scrollView respondsToSelector:@selector(setContentInsetAdjustmentBehavior:)]) {
      _webView.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    }
#endif
    [self addSubview:_webView];
  }
  return self;
}

ABI34_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)goForward
{
  [_webView goForward];
}

- (void)goBack
{
  [_webView goBack];
}

- (void)reload
{
  NSURLRequest *request = [ABI34_0_0RCTConvert NSURLRequest:self.source];
  if (request.URL && !_webView.request.URL.absoluteString.length) {
    [_webView loadRequest:request];
  }
  else {
    [_webView reload];
  }
}

- (void)stopLoading
{
  [_webView stopLoading];
}

- (void)postMessage:(NSString *)message
{
  NSDictionary *eventInitDict = @{
    @"data": message,
  };
  NSString *source = [NSString
    stringWithFormat:@"window.dispatchEvent(new MessageEvent('message', %@));",
    ABI34_0_0RCTJSONStringify(eventInitDict, NULL)
  ];
  [_webView stringByEvaluatingJavaScriptFromString:source];
}

- (void)injectJavaScript:(NSString *)script
{
  [_webView stringByEvaluatingJavaScriptFromString:script];
}

- (void)setSource:(NSDictionary *)source
{
  if (![_source isEqualToDictionary:source]) {
    _source = [source copy];

    // Check for a static html source first
    NSString *html = [ABI34_0_0RCTConvert NSString:source[@"html"]];
    if (html) {
      NSURL *baseURL = [ABI34_0_0RCTConvert NSURL:source[@"baseUrl"]];
      if (!baseURL) {
        baseURL = [NSURL URLWithString:@"about:blank"];
      }
      [_webView loadHTMLString:html baseURL:baseURL];
      return;
    }

    NSURLRequest *request = [ABI34_0_0RCTConvert NSURLRequest:source];
    // Because of the way ReactABI34_0_0 works, as pages redirect, we actually end up
    // passing the redirect urls back here, so we ignore them if trying to load
    // the same url. We'll expose a call to 'reload' to allow a user to load
    // the existing page.
    if ([request.URL isEqual:_webView.request.URL]) {
      return;
    }
    if (!request.URL) {
      // Clear the webview
      [_webView loadHTMLString:@"" baseURL:nil];
      return;
    }
    [_webView loadRequest:request];
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _webView.frame = self.bounds;
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [ABI34_0_0RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:NO];
}

- (void)setScalesPageToFit:(BOOL)scalesPageToFit
{
  if (_webView.scalesPageToFit != scalesPageToFit) {
    _webView.scalesPageToFit = scalesPageToFit;
    [_webView reload];
  }
}

- (BOOL)scalesPageToFit
{
  return _webView.scalesPageToFit;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  CGFloat alpha = CGColorGetAlpha(backgroundColor.CGColor);
  self.opaque = _webView.opaque = (alpha == 1.0);
  _webView.backgroundColor = backgroundColor;
}

- (UIColor *)backgroundColor
{
  return _webView.backgroundColor;
}

- (NSMutableDictionary<NSString *, id> *)baseEvent
{
  NSMutableDictionary<NSString *, id> *event = [[NSMutableDictionary alloc] initWithDictionary:@{
    @"url": _webView.request.URL.absoluteString ?: @"",
    @"loading" : @(_webView.loading),
    @"title": [_webView stringByEvaluatingJavaScriptFromString:@"document.title"],
    @"canGoBack": @(_webView.canGoBack),
    @"canGoForward" : @(_webView.canGoForward),
  }];

  return event;
}

- (void)refreshContentInset
{
  [ABI34_0_0RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:YES];
}

#pragma mark - UIWebViewDelegate methods

- (BOOL)webView:(__unused UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request
 navigationType:(UIWebViewNavigationType)navigationType
{
  BOOL isJSNavigation = [request.URL.scheme isEqualToString:ABI34_0_0RNCJSNavigationScheme];

  static NSDictionary<NSNumber *, NSString *> *navigationTypes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    navigationTypes = @{
      @(UIWebViewNavigationTypeLinkClicked): @"click",
      @(UIWebViewNavigationTypeFormSubmitted): @"formsubmit",
      @(UIWebViewNavigationTypeBackForward): @"backforward",
      @(UIWebViewNavigationTypeReload): @"reload",
      @(UIWebViewNavigationTypeFormResubmitted): @"formresubmit",
      @(UIWebViewNavigationTypeOther): @"other",
    };
  });

  // skip this for the JS Navigation handler
  if (!isJSNavigation && _onShouldStartLoadWithRequest) {
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
      @"url": (request.URL).absoluteString,
      @"mainDocumentURL": (request.mainDocumentURL).absoluteString,
      @"navigationType": navigationTypes[@(navigationType)]
    }];
    if (![self.delegate webView:self
      shouldStartLoadForRequest:event
                   withCallback:_onShouldStartLoadWithRequest]) {
      return NO;
    }
  }

  if (_onLoadingStart) {
    // We have this check to filter out iframe requests and whatnot
    BOOL isTopFrame = [request.URL isEqual:request.mainDocumentURL];
    if (isTopFrame) {
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      [event addEntriesFromDictionary: @{
        @"url": (request.URL).absoluteString,
        @"navigationType": navigationTypes[@(navigationType)]
      }];
      _onLoadingStart(event);
    }
  }

  if (isJSNavigation && [request.URL.host isEqualToString:MessageHandlerName]) {
    NSString *data = request.URL.query;
    data = [data stringByReplacingOccurrencesOfString:@"+" withString:@" "];
    data = [data stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
      @"data": data,
    }];

    NSString *source = [NSString stringWithFormat:@"window.%@.messageReceived();", MessageHandlerName];

    [_webView stringByEvaluatingJavaScriptFromString:source];

    _onMessage(event);
  }

  // JS Navigation handler
  return !isJSNavigation;
}

- (void)webView:(__unused UIWebView *)webView didFailLoadWithError:(NSError *)error
{
  if (_onLoadingError) {
    if ([error.domain isEqualToString:NSURLErrorDomain] && error.code == NSURLErrorCancelled) {
      // NSURLErrorCancelled is reported when a page has a redirect OR if you load
      // a new URL in the WebView before the previous one came back. We can just
      // ignore these since they aren't real errors.
      // http://stackoverflow.com/questions/1024748/how-do-i-fix-nsurlerrordomain-error-999-in-iphone-3-0-os
      return;
    }

    if ([error.domain isEqualToString:@"WebKitErrorDomain"] && error.code == 102) {
      // Error code 102 "Frame load interrupted" is raised by the UIWebView if
      // its delegate returns FALSE from webView:shouldStartLoadWithRequest:navigationType
      // when the URL is from an http redirect. This is a common pattern when
      // implementing OAuth with a WebView.
      return;
    }

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary:@{
      @"domain": error.domain,
      @"code": @(error.code),
      @"description": error.localizedDescription,
    }];
    _onLoadingError(event);
  }
}

- (void)webViewDidFinishLoad:(UIWebView *)webView
{
  if (_messagingEnabled) {
    NSString *source = [NSString stringWithFormat:
      @"(function() {"
       "  var messageQueue = [];"
       "  var messagePending = false;"

       "  function processQueue () {"
       "    if (!messageQueue.length || messagePending) return;"
       "    messagePending = true;"
       "    document.location = '%@://%@?' + encodeURIComponent(messageQueue.shift());"
       "  }"

       "  window.%@ = {"
       "    postMessage: function (data) {"
       "      messageQueue.push(String(data));"
       "      processQueue();"
       "    },"
       "    messageReceived: function () {"
       "      messagePending = false;"
       "      processQueue();"
       "    }"
       "  };"
       "})();", ABI34_0_0RNCJSNavigationScheme, MessageHandlerName, MessageHandlerName
    ];
    [webView stringByEvaluatingJavaScriptFromString:source];
  }
  if (_injectedJavaScript != nil) {
    NSString *jsEvaluationValue = [webView stringByEvaluatingJavaScriptFromString:_injectedJavaScript];

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    event[@"jsEvaluationValue"] = jsEvaluationValue;

    _onLoadingFinish(event);
  }
  // we only need the final 'finishLoad' call so only fire the event when we're actually done loading.
  else if (_onLoadingFinish && !webView.loading && ![webView.request.URL.absoluteString isEqualToString:@"about:blank"]) {
    _onLoadingFinish([self baseEvent]);
  }
}

@end
