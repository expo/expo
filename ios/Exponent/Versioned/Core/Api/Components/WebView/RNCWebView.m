/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCWebView.h"
#import <React/RCTConvert.h>
#import <React/RCTAutoInsetsProtocol.h>
#import "RNCWKProcessPoolManager.h"
#if !TARGET_OS_OSX
#import <UIKit/UIKit.h>
#else
#import <React/RCTUIKit.h>
#endif // !TARGET_OS_OSX

#import "objc/runtime.h"

static NSTimer *keyboardTimer;
static NSString *const HistoryShimName = @"ReactNativeHistoryShim";
static NSString *const MessageHandlerName = @"ReactNativeWebView";
static NSURLCredential* clientAuthenticationCredential;
static NSDictionary* customCertificatesForHost;

#if !TARGET_OS_OSX
// runtime trick to remove WKWebView keyboard default toolbar
// see: http://stackoverflow.com/questions/19033292/ios-7-uiwebview-keyboard-issue/19042279#19042279
@interface _SwizzleHelperWK : UIView
@property (nonatomic, copy) WKWebView *webView;
@end
@implementation _SwizzleHelperWK
-(id)inputAccessoryView
{
    if (_webView == nil) {
        return nil;
    }

    if ([_webView respondsToSelector:@selector(inputAssistantItem)]) {
        UITextInputAssistantItem *inputAssistantItem = [_webView inputAssistantItem];
        inputAssistantItem.leadingBarButtonGroups = @[];
        inputAssistantItem.trailingBarButtonGroups = @[];
    }
    return nil;
}
@end
#endif // !TARGET_OS_OSX

#if TARGET_OS_OSX
@interface RNCWKWebView : WKWebView
@end
@implementation RNCWKWebView
- (void)scrollWheel:(NSEvent *)theEvent {
  RNCWebView *rncWebView = (RNCWebView *)[self superview];
  RCTAssert([rncWebView isKindOfClass:[rncWebView class]], @"superview must be an RNCWebView");
  if (![rncWebView scrollEnabled]) {
    [[self nextResponder] scrollWheel:theEvent];
    return;
  }
  [super scrollWheel:theEvent];
}
@end
#endif // TARGET_OS_OSX

@interface RNCWebView () <WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler,
#if !TARGET_OS_OSX
    UIScrollViewDelegate,
#endif // !TARGET_OS_OSX
    RCTAutoInsetsProtocol>

@property (nonatomic, copy) RCTDirectEventBlock onFileDownload;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingProgress;
@property (nonatomic, copy) RCTDirectEventBlock onShouldStartLoadWithRequest;
@property (nonatomic, copy) RCTDirectEventBlock onHttpError;
@property (nonatomic, copy) RCTDirectEventBlock onMessage;
@property (nonatomic, copy) RCTDirectEventBlock onScroll;
@property (nonatomic, copy) RCTDirectEventBlock onContentProcessDidTerminate;
#if !TARGET_OS_OSX
@property (nonatomic, copy) WKWebView *webView;
#else
@property (nonatomic, copy) RNCWKWebView *webView;
#endif // !TARGET_OS_OSX
@property (nonatomic, strong) WKUserScript *postMessageScript;
@property (nonatomic, strong) WKUserScript *atStartScript;
@property (nonatomic, strong) WKUserScript *atEndScript;
@end

@implementation RNCWebView
{
#if !TARGET_OS_OSX
  UIColor * _savedBackgroundColor;
#else
  RCTUIColor * _savedBackgroundColor;
#endif // !TARGET_OS_OSX
  BOOL _savedHideKeyboardAccessoryView;
  BOOL _savedKeyboardDisplayRequiresUserAction;

  // Workaround for StatusBar appearance bug for iOS 12
  // https://github.com/react-native-community/react-native-webview/issues/62
  BOOL _isFullScreenVideoOpen;
#if !TARGET_OS_OSX
  UIStatusBarStyle _savedStatusBarStyle;
#endif // !TARGET_OS_OSX
  BOOL _savedStatusBarHidden;

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
  UIScrollViewContentInsetAdjustmentBehavior _savedContentInsetAdjustmentBehavior;
#endif
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    #if !TARGET_OS_OSX
    super.backgroundColor = [UIColor clearColor];
    #else
    super.backgroundColor = [RCTUIColor clearColor];
    #endif // !TARGET_OS_OSX
    _bounces = YES;
    _scrollEnabled = YES;
    _showsHorizontalScrollIndicator = YES;
    _showsVerticalScrollIndicator = YES;
    _directionalLockEnabled = YES;
    _automaticallyAdjustContentInsets = YES;
    _contentInset = UIEdgeInsetsZero;
    _savedKeyboardDisplayRequiresUserAction = YES;
    #if !TARGET_OS_OSX
    _savedStatusBarStyle = RCTSharedApplication().statusBarStyle;
    _savedStatusBarHidden = RCTSharedApplication().statusBarHidden;
    #endif // !TARGET_OS_OSX
    _injectedJavaScript = nil;
    _injectedJavaScriptForMainFrameOnly = YES;
    _injectedJavaScriptBeforeContentLoaded = nil;
    _injectedJavaScriptBeforeContentLoadedForMainFrameOnly = YES;

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
    _savedContentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
#endif
  }

#if !TARGET_OS_OSX
    [[NSNotificationCenter defaultCenter]addObserver:self
    selector:@selector(appDidBecomeActive)
        name:UIApplicationDidBecomeActiveNotification
      object:nil];
    
    [[NSNotificationCenter defaultCenter]addObserver:self
    selector:@selector(appWillResignActive)
        name:UIApplicationWillResignActiveNotification
      object:nil];
  if (@available(iOS 12.0, *)) {
    // Workaround for a keyboard dismissal bug present in iOS 12
    // https://openradar.appspot.com/radar?id=5018321736957952
    [[NSNotificationCenter defaultCenter]
      addObserver:self
      selector:@selector(keyboardWillHide)
      name:UIKeyboardWillHideNotification object:nil];
    [[NSNotificationCenter defaultCenter]
      addObserver:self
      selector:@selector(keyboardWillShow)
      name:UIKeyboardWillShowNotification object:nil];

    // Workaround for StatusBar appearance bug for iOS 12
    // https://github.com/react-native-community/react-native-webview/issues/62
      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(showFullScreenVideoStatusBars)
                                                   name:UIWindowDidBecomeVisibleNotification
                                                 object:nil];

      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(hideFullScreenVideoStatusBars)
                                                   name:UIWindowDidBecomeHiddenNotification
                                                 object:nil];
      
  }
#endif // !TARGET_OS_OSX
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

/**
 * See https://stackoverflow.com/questions/25713069/why-is-wkwebview-not-opening-links-with-target-blank/25853806#25853806 for details.
 */
- (WKWebView *)webView:(WKWebView *)webView createWebViewWithConfiguration:(WKWebViewConfiguration *)configuration forNavigationAction:(WKNavigationAction *)navigationAction windowFeatures:(WKWindowFeatures *)windowFeatures
{
  if (!navigationAction.targetFrame.isMainFrame) {
    [webView loadRequest:navigationAction.request];
  }
  return nil;
}

- (WKWebViewConfiguration *)setUpWkWebViewConfig
{
  WKWebViewConfiguration *wkWebViewConfig = [WKWebViewConfiguration new];
  WKPreferences *prefs = [[WKPreferences alloc]init];
  BOOL _prefsUsed = NO;
  if (!_javaScriptEnabled) {
    prefs.javaScriptEnabled = NO;
    _prefsUsed = YES;
  }
  if (_allowFileAccessFromFileURLs) {
    [prefs setValue:@TRUE forKey:@"allowFileAccessFromFileURLs"];
    _prefsUsed = YES;
  }
  if (_prefsUsed) {
    wkWebViewConfig.preferences = prefs;
  }
  if (_incognito) {
    wkWebViewConfig.websiteDataStore = [WKWebsiteDataStore nonPersistentDataStore];
  } else if (_cacheEnabled) {
    wkWebViewConfig.websiteDataStore = [WKWebsiteDataStore defaultDataStore];
  }
  if(self.useSharedProcessPool) {
    wkWebViewConfig.processPool = [[RNCWKProcessPoolManager sharedManager] sharedProcessPool];
  }
  wkWebViewConfig.userContentController = [WKUserContentController new];

  // Shim the HTML5 history API:
  [wkWebViewConfig.userContentController addScriptMessageHandler:[[RNCWeakScriptMessageDelegate alloc] initWithDelegate:self]
                                                            name:HistoryShimName];
  [self resetupScripts:wkWebViewConfig];

#if !TARGET_OS_OSX
  wkWebViewConfig.allowsInlineMediaPlayback = _allowsInlineMediaPlayback;
#if WEBKIT_IOS_10_APIS_AVAILABLE
  wkWebViewConfig.mediaTypesRequiringUserActionForPlayback = _mediaPlaybackRequiresUserAction
    ? WKAudiovisualMediaTypeAll
    : WKAudiovisualMediaTypeNone;
  wkWebViewConfig.dataDetectorTypes = _dataDetectorTypes;
#else
  wkWebViewConfig.mediaPlaybackRequiresUserAction = _mediaPlaybackRequiresUserAction;
#endif
#endif // !TARGET_OS_OSX

  if (_applicationNameForUserAgent) {
      wkWebViewConfig.applicationNameForUserAgent = [NSString stringWithFormat:@"%@ %@", wkWebViewConfig.applicationNameForUserAgent, _applicationNameForUserAgent];
  }
  
  return wkWebViewConfig;
}

- (void)didMoveToWindow
{
  if (self.window != nil && _webView == nil) {
    WKWebViewConfiguration *wkWebViewConfig = [self setUpWkWebViewConfig];
#if !TARGET_OS_OSX
    _webView = [[WKWebView alloc] initWithFrame:self.bounds configuration: wkWebViewConfig];
#else
    _webView = [[RNCWKWebView alloc] initWithFrame:self.bounds configuration: wkWebViewConfig];
#endif // !TARGET_OS_OSX

    [self setBackgroundColor: _savedBackgroundColor];
#if !TARGET_OS_OSX
    _webView.scrollView.delegate = self;
#endif // !TARGET_OS_OSX
    _webView.UIDelegate = self;
    _webView.navigationDelegate = self;
#if !TARGET_OS_OSX
    _webView.scrollView.scrollEnabled = _scrollEnabled;
    _webView.scrollView.pagingEnabled = _pagingEnabled;
    _webView.scrollView.bounces = _bounces;
    _webView.scrollView.showsHorizontalScrollIndicator = _showsHorizontalScrollIndicator;
    _webView.scrollView.showsVerticalScrollIndicator = _showsVerticalScrollIndicator;
    _webView.scrollView.directionalLockEnabled = _directionalLockEnabled;
#endif // !TARGET_OS_OSX
    _webView.allowsLinkPreview = _allowsLinkPreview;
    [_webView addObserver:self forKeyPath:@"estimatedProgress" options:NSKeyValueObservingOptionOld | NSKeyValueObservingOptionNew context:nil];
    _webView.allowsBackForwardNavigationGestures = _allowsBackForwardNavigationGestures;

    if (_userAgent) {
      _webView.customUserAgent = _userAgent;
    }
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
    if ([_webView.scrollView respondsToSelector:@selector(setContentInsetAdjustmentBehavior:)]) {
      _webView.scrollView.contentInsetAdjustmentBehavior = _savedContentInsetAdjustmentBehavior;
    }
#endif

    [self addSubview:_webView];
    [self setHideKeyboardAccessoryView: _savedHideKeyboardAccessoryView];
    [self setKeyboardDisplayRequiresUserAction: _savedKeyboardDisplayRequiresUserAction];
    [self visitSource];
  }
}

// Update webview property when the component prop changes.
- (void)setAllowsBackForwardNavigationGestures:(BOOL)allowsBackForwardNavigationGestures {
  _allowsBackForwardNavigationGestures = allowsBackForwardNavigationGestures;
  _webView.allowsBackForwardNavigationGestures = _allowsBackForwardNavigationGestures;
}


- (void)removeFromSuperview
{
    if (_webView) {
        [_webView.configuration.userContentController removeScriptMessageHandlerForName:MessageHandlerName];
        [_webView removeObserver:self forKeyPath:@"estimatedProgress"];
        [_webView removeFromSuperview];
#if !TARGET_OS_OSX
        _webView.scrollView.delegate = nil;
#endif // !TARGET_OS_OSX
        _webView = nil;
    }

    [super removeFromSuperview];
}

#if !TARGET_OS_OSX
-(void)showFullScreenVideoStatusBars
{
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    _isFullScreenVideoOpen = YES;
    RCTUnsafeExecuteOnMainQueueSync(^{
      [RCTSharedApplication() setStatusBarStyle:UIStatusBarStyleLightContent animated:YES];
    });
#pragma clang diagnostic pop
}

-(void)hideFullScreenVideoStatusBars
{
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    _isFullScreenVideoOpen = NO;
    RCTUnsafeExecuteOnMainQueueSync(^{
      [RCTSharedApplication() setStatusBarHidden:self->_savedStatusBarHidden animated:YES];
      [RCTSharedApplication() setStatusBarStyle:self->_savedStatusBarStyle animated:YES];
    });
#pragma clang diagnostic pop
}

-(void)keyboardWillHide
{
    keyboardTimer = [NSTimer scheduledTimerWithTimeInterval:0 target:self selector:@selector(keyboardDisplacementFix) userInfo:nil repeats:false];
    [[NSRunLoop mainRunLoop] addTimer:keyboardTimer forMode:NSRunLoopCommonModes];
}
-(void)keyboardWillShow
{
    if (keyboardTimer != nil) {
        [keyboardTimer invalidate];
    }
}
-(void)keyboardDisplacementFix
{
    // Additional viewport checks to prevent unintentional scrolls
    UIScrollView *scrollView = self.webView.scrollView;
    double maxContentOffset = scrollView.contentSize.height - scrollView.frame.size.height;
    if (maxContentOffset < 0) {
        maxContentOffset = 0;
    }
    if (scrollView.contentOffset.y > maxContentOffset) {
      // https://stackoverflow.com/a/9637807/824966
      [UIView animateWithDuration:.25 animations:^{
          scrollView.contentOffset = CGPointMake(0, maxContentOffset);
      }];
    }
}
#endif // !TARGET_OS_OSX

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context{
    if ([keyPath isEqual:@"estimatedProgress"] && object == self.webView) {
        if(_onLoadingProgress){
             NSMutableDictionary<NSString *, id> *event = [self baseEvent];
            [event addEntriesFromDictionary:@{@"progress":[NSNumber numberWithDouble:self.webView.estimatedProgress]}];
            _onLoadingProgress(event);
        }
    }else{
        [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    }
}

#if !TARGET_OS_OSX
- (void)setBackgroundColor:(UIColor *)backgroundColor
#else
- (void)setBackgroundColor:(RCTUIColor *)backgroundColor
#endif // !TARGET_OS_OSX
{
  _savedBackgroundColor = backgroundColor;
  if (_webView == nil) {
    return;
  }

  CGFloat alpha = CGColorGetAlpha(backgroundColor.CGColor);
  BOOL opaque = (alpha == 1.0);
#if !TARGET_OS_OSX
  self.opaque = _webView.opaque = opaque;
  _webView.scrollView.backgroundColor = backgroundColor;
  _webView.backgroundColor = backgroundColor;
#else
  // https://stackoverflow.com/questions/40007753/macos-wkwebview-background-transparency
  NSOperatingSystemVersion version = { 10, 12, 0 };
  if ([[NSProcessInfo processInfo] isOperatingSystemAtLeastVersion:version]) {
    [_webView setValue:@(opaque) forKey: @"drawsBackground"];
  } else {
    [_webView setValue:@(!opaque) forKey: @"drawsTransparentBackground"];
  }
#endif // !TARGET_OS_OSX
}

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
- (void)setContentInsetAdjustmentBehavior:(UIScrollViewContentInsetAdjustmentBehavior)behavior
{
    _savedContentInsetAdjustmentBehavior = behavior;
    if (_webView == nil) {
        return;
    }

    if ([_webView.scrollView respondsToSelector:@selector(setContentInsetAdjustmentBehavior:)]) {
        CGPoint contentOffset = _webView.scrollView.contentOffset;
        _webView.scrollView.contentInsetAdjustmentBehavior = behavior;
        _webView.scrollView.contentOffset = contentOffset;
    }
}
#endif

/**
 * This method is called whenever JavaScript running within the web view calls:
 *   - window.webkit.messageHandlers[MessageHandlerName].postMessage
 */
- (void)userContentController:(WKUserContentController *)userContentController
       didReceiveScriptMessage:(WKScriptMessage *)message
{
  if ([message.name isEqualToString:HistoryShimName]) {
    if (_onLoadingFinish) {
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      [event addEntriesFromDictionary: @{@"navigationType": message.body}];
      _onLoadingFinish(event);
    }
  } else if ([message.name isEqualToString:MessageHandlerName]) {
    if (_onMessage) {
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      [event addEntriesFromDictionary: @{@"data": message.body}];
      _onMessage(event);
    }
  }
}

- (void)setSource:(NSDictionary *)source
{
  if (![_source isEqualToDictionary:source]) {
    _source = [source copy];

    if (_webView != nil) {
      [self visitSource];
    }
  }
}

- (void)setAllowingReadAccessToURL:(NSString *)allowingReadAccessToURL
{
  if (![_allowingReadAccessToURL isEqualToString:allowingReadAccessToURL]) {
    _allowingReadAccessToURL = [allowingReadAccessToURL copy];

    if (_webView != nil) {
      [self visitSource];
    }
  }
}

#if !TARGET_OS_OSX
- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:NO];
}

- (void)refreshContentInset
{
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:YES];
}
#endif // !TARGET_OS_OSX

- (void)visitSource
{
    // Check for a static html source first
    NSString *html = [RCTConvert NSString:_source[@"html"]];
    if (html) {
        NSURL *baseURL = [RCTConvert NSURL:_source[@"baseUrl"]];
        if (!baseURL) {
            baseURL = [NSURL URLWithString:@"about:blank"];
        }
        [_webView loadHTMLString:html baseURL:baseURL];
        return;
    }

    NSURLRequest *request = [self requestForSource:_source];
    // Because of the way React works, as pages redirect, we actually end up
    // passing the redirect urls back here, so we ignore them if trying to load
    // the same url. We'll expose a call to 'reload' to allow a user to load
    // the existing page.
    if ([request.URL isEqual:_webView.URL]) {
        return;
    }
    if (!request.URL) {
        // Clear the webview
        [_webView loadHTMLString:@"" baseURL:nil];
        return;
    }
    if (request.URL.host) {
        [_webView loadRequest:request];
    }
    else {
        NSURL* readAccessUrl = _allowingReadAccessToURL ? [RCTConvert NSURL:_allowingReadAccessToURL] : request.URL;
        [_webView loadFileURL:request.URL allowingReadAccessToURL:readAccessUrl];
    }
}

#if !TARGET_OS_OSX
-(void)setKeyboardDisplayRequiresUserAction:(BOOL)keyboardDisplayRequiresUserAction
{
    if (_webView == nil) {
        _savedKeyboardDisplayRequiresUserAction = keyboardDisplayRequiresUserAction;
        return;
    }

    if (_savedKeyboardDisplayRequiresUserAction == true) {
        return;
    }

    UIView* subview;

    for (UIView* view in _webView.scrollView.subviews) {
        if([[view.class description] hasPrefix:@"WK"])
            subview = view;
    }

    if(subview == nil) return;

    Class class = subview.class;

    NSOperatingSystemVersion iOS_11_3_0 = (NSOperatingSystemVersion){11, 3, 0};
    NSOperatingSystemVersion iOS_12_2_0 = (NSOperatingSystemVersion){12, 2, 0};
    NSOperatingSystemVersion iOS_13_0_0 = (NSOperatingSystemVersion){13, 0, 0};

    Method method;
    IMP override;

    if ([[NSProcessInfo processInfo] isOperatingSystemAtLeastVersion: iOS_13_0_0]) {
        // iOS 13.0.0 - Future
        SEL selector = sel_getUid("_elementDidFocus:userIsInteracting:blurPreviousNode:activityStateChanges:userObject:");
        method = class_getInstanceMethod(class, selector);
        IMP original = method_getImplementation(method);
        override = imp_implementationWithBlock(^void(id me, void* arg0, BOOL arg1, BOOL arg2, BOOL arg3, id arg4) {
            ((void (*)(id, SEL, void*, BOOL, BOOL, BOOL, id))original)(me, selector, arg0, TRUE, arg2, arg3, arg4);
        });
    }
    else if ([[NSProcessInfo processInfo] isOperatingSystemAtLeastVersion: iOS_12_2_0]) {
        // iOS 12.2.0 - iOS 13.0.0
        SEL selector = sel_getUid("_elementDidFocus:userIsInteracting:blurPreviousNode:changingActivityState:userObject:");
        method = class_getInstanceMethod(class, selector);
        IMP original = method_getImplementation(method);
        override = imp_implementationWithBlock(^void(id me, void* arg0, BOOL arg1, BOOL arg2, BOOL arg3, id arg4) {
            ((void (*)(id, SEL, void*, BOOL, BOOL, BOOL, id))original)(me, selector, arg0, TRUE, arg2, arg3, arg4);
        });
    }
    else if ([[NSProcessInfo processInfo] isOperatingSystemAtLeastVersion: iOS_11_3_0]) {
        // iOS 11.3.0 - 12.2.0
        SEL selector = sel_getUid("_startAssistingNode:userIsInteracting:blurPreviousNode:changingActivityState:userObject:");
        method = class_getInstanceMethod(class, selector);
        IMP original = method_getImplementation(method);
        override = imp_implementationWithBlock(^void(id me, void* arg0, BOOL arg1, BOOL arg2, BOOL arg3, id arg4) {
            ((void (*)(id, SEL, void*, BOOL, BOOL, BOOL, id))original)(me, selector, arg0, TRUE, arg2, arg3, arg4);
        });
    } else {
        // iOS 9.0 - 11.3.0
        SEL selector = sel_getUid("_startAssistingNode:userIsInteracting:blurPreviousNode:userObject:");
        method = class_getInstanceMethod(class, selector);
        IMP original = method_getImplementation(method);
        override = imp_implementationWithBlock(^void(id me, void* arg0, BOOL arg1, BOOL arg2, id arg3) {
            ((void (*)(id, SEL, void*, BOOL, BOOL, id))original)(me, selector, arg0, TRUE, arg2, arg3);
        });
    }

    method_setImplementation(method, override);
}

-(void)setHideKeyboardAccessoryView:(BOOL)hideKeyboardAccessoryView
{
    if (_webView == nil) {
        _savedHideKeyboardAccessoryView = hideKeyboardAccessoryView;
        return;
    }

    if (_savedHideKeyboardAccessoryView == false) {
        return;
    }

    UIView* subview;

    for (UIView* view in _webView.scrollView.subviews) {
        if([[view.class description] hasPrefix:@"WK"])
            subview = view;
    }

    if(subview == nil) return;

    NSString* name = [NSString stringWithFormat:@"%@_SwizzleHelperWK", subview.class.superclass];
    Class newClass = NSClassFromString(name);

    if(newClass == nil)
    {
        newClass = objc_allocateClassPair(subview.class, [name cStringUsingEncoding:NSASCIIStringEncoding], 0);
        if(!newClass) return;

        Method method = class_getInstanceMethod([_SwizzleHelperWK class], @selector(inputAccessoryView));
        class_addMethod(newClass, @selector(inputAccessoryView), method_getImplementation(method), method_getTypeEncoding(method));

        objc_registerClassPair(newClass);
    }

    object_setClass(subview, newClass);
}

// UIScrollViewDelegate method
- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  scrollView.decelerationRate = _decelerationRate;
}
#endif // !TARGET_OS_OSX

- (void)setScrollEnabled:(BOOL)scrollEnabled
{
  _scrollEnabled = scrollEnabled;
#if !TARGET_OS_OSX
  _webView.scrollView.scrollEnabled = scrollEnabled;
#endif // !TARGET_OS_OSX
}

#if !TARGET_OS_OSX
// UIScrollViewDelegate method
- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  // Don't allow scrolling the scrollView.
  if (!_scrollEnabled) {
    scrollView.bounds = _webView.bounds;
  }
  else if (_onScroll != nil) {
    NSDictionary *event = @{
      @"contentOffset": @{
          @"x": @(scrollView.contentOffset.x),
          @"y": @(scrollView.contentOffset.y)
          },
      @"contentInset": @{
          @"top": @(scrollView.contentInset.top),
          @"left": @(scrollView.contentInset.left),
          @"bottom": @(scrollView.contentInset.bottom),
          @"right": @(scrollView.contentInset.right)
          },
      @"contentSize": @{
          @"width": @(scrollView.contentSize.width),
          @"height": @(scrollView.contentSize.height)
          },
      @"layoutMeasurement": @{
          @"width": @(scrollView.frame.size.width),
          @"height": @(scrollView.frame.size.height)
          },
      @"zoomScale": @(scrollView.zoomScale ?: 1),
      };
    _onScroll(event);
  }
}

- (void)setDirectionalLockEnabled:(BOOL)directionalLockEnabled
{
    _directionalLockEnabled = directionalLockEnabled;
    _webView.scrollView.directionalLockEnabled = directionalLockEnabled;
}

- (void)setShowsHorizontalScrollIndicator:(BOOL)showsHorizontalScrollIndicator
{
    _showsHorizontalScrollIndicator = showsHorizontalScrollIndicator;
    _webView.scrollView.showsHorizontalScrollIndicator = showsHorizontalScrollIndicator;
}

- (void)setShowsVerticalScrollIndicator:(BOOL)showsVerticalScrollIndicator
{
    _showsVerticalScrollIndicator = showsVerticalScrollIndicator;
    _webView.scrollView.showsVerticalScrollIndicator = showsVerticalScrollIndicator;
}
#endif // !TARGET_OS_OSX

- (void)postMessage:(NSString *)message
{
  NSDictionary *eventInitDict = @{@"data": message};
  NSString *source = [NSString
    stringWithFormat:@"window.dispatchEvent(new MessageEvent('message', %@));",
    RCTJSONStringify(eventInitDict, NULL)
  ];
  [self injectJavaScript: source];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  // Ensure webview takes the position and dimensions of RNCWebView
  _webView.frame = self.bounds;
#if !TARGET_OS_OSX
  _webView.scrollView.contentInset = _contentInset;
#endif // !TARGET_OS_OSX
}

- (NSMutableDictionary<NSString *, id> *)baseEvent
{
  NSDictionary *event = @{
    @"url": _webView.URL.absoluteString ?: @"",
    @"title": _webView.title ?: @"",
    @"loading" : @(_webView.loading),
    @"canGoBack": @(_webView.canGoBack),
    @"canGoForward" : @(_webView.canGoForward)
  };
  return [[NSMutableDictionary alloc] initWithDictionary: event];
}

+ (void)setClientAuthenticationCredential:(nullable NSURLCredential*)credential {
  clientAuthenticationCredential = credential;
}

+ (void)setCustomCertificatesForHost:(nullable NSDictionary*)certificates {
    customCertificatesForHost = certificates;
}

- (void)                    webView:(WKWebView *)webView
  didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge
                  completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential * _Nullable))completionHandler
{
    NSString* host = nil;
    if (webView.URL != nil) {
        host = webView.URL.host;
    }
    if ([[challenge protectionSpace] authenticationMethod] == NSURLAuthenticationMethodClientCertificate) {
        completionHandler(NSURLSessionAuthChallengeUseCredential, clientAuthenticationCredential);
        return;
    }
    if ([[challenge protectionSpace] serverTrust] != nil && customCertificatesForHost != nil && host != nil) {
        SecCertificateRef localCertificate = (__bridge SecCertificateRef)([customCertificatesForHost objectForKey:host]);
        if (localCertificate != nil) {
            NSData *localCertificateData = (NSData*) CFBridgingRelease(SecCertificateCopyData(localCertificate));
            SecTrustRef trust = [[challenge protectionSpace] serverTrust];
            long count = SecTrustGetCertificateCount(trust);
            for (long i = 0; i < count; i++) {
                SecCertificateRef serverCertificate = SecTrustGetCertificateAtIndex(trust, i);
                if (serverCertificate == nil) { continue; }
                NSData *serverCertificateData = (NSData *) CFBridgingRelease(SecCertificateCopyData(serverCertificate));
                if ([serverCertificateData isEqualToData:localCertificateData]) {
                    NSURLCredential *useCredential = [NSURLCredential credentialForTrust:trust];
                    if (challenge.sender != nil) {
                        [challenge.sender useCredential:useCredential forAuthenticationChallenge:challenge];
                    }
                    completionHandler(NSURLSessionAuthChallengeUseCredential, useCredential);
                    return;
                }
            }
        }
    }
    completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
}

#pragma mark - WKNavigationDelegate methods

/**
 * alert
 */
- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(void))completionHandler
{
#if !TARGET_OS_OSX
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"" message:message preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:@"Ok" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
    completionHandler();
  }]];
  [[self topViewController] presentViewController:alert animated:YES completion:NULL];
#else
  NSAlert *alert = [[NSAlert alloc] init];
  [alert setMessageText:message];
  [alert beginSheetModalForWindow:[NSApp keyWindow] completionHandler:^(__unused NSModalResponse response){
    completionHandler();
  }];
#endif // !TARGET_OS_OSX
}

/**
 * confirm
 */
- (void)webView:(WKWebView *)webView runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(BOOL))completionHandler{
#if !TARGET_OS_OSX
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"" message:message preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:@"Ok" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
    completionHandler(YES);
  }]];
  [alert addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(UIAlertAction *action) {
    completionHandler(NO);
  }]];
  [[self topViewController] presentViewController:alert animated:YES completion:NULL];
#else
  NSAlert *alert = [[NSAlert alloc] init];
  [alert setMessageText:message];
  [alert addButtonWithTitle:NSLocalizedString(@"OK", @"OK button")];
  [alert addButtonWithTitle:NSLocalizedString(@"Cancel", @"Cancel button")];
  void (^callbacksHandlers)(NSModalResponse response) = ^void(NSModalResponse response) {
    completionHandler(response == NSAlertFirstButtonReturn);
  };
  [alert beginSheetModalForWindow:[NSApp keyWindow] completionHandler:callbacksHandlers];
#endif // !TARGET_OS_OSX
}

/**
 * prompt
 */
- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString *))completionHandler{
#if !TARGET_OS_OSX
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"" message:prompt preferredStyle:UIAlertControllerStyleAlert];
  [alert addTextFieldWithConfigurationHandler:^(UITextField *textField) {
    textField.text = defaultText;
  }];
  UIAlertAction *okAction = [UIAlertAction actionWithTitle:@"Ok" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
    completionHandler([[alert.textFields lastObject] text]);
  }];
  [alert addAction:okAction];
  UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(UIAlertAction *action) {
    completionHandler(nil);
  }];
  [alert addAction:cancelAction];
  alert.preferredAction = okAction;
  [[self topViewController] presentViewController:alert animated:YES completion:NULL];
#else
  NSAlert *alert = [[NSAlert alloc] init];
  [alert setMessageText:prompt];

  const NSRect RCTSingleTextFieldFrame = NSMakeRect(0.0, 0.0, 275.0, 22.0);
  NSTextField *textField = [[NSTextField alloc] initWithFrame:RCTSingleTextFieldFrame];
  textField.cell.scrollable = YES;
  if (@available(macOS 10.11, *)) {
    textField.maximumNumberOfLines = 1;
  }
  textField.stringValue = defaultText;
  [alert setAccessoryView:textField];

  [alert addButtonWithTitle:NSLocalizedString(@"OK", @"OK button")];
  [alert addButtonWithTitle:NSLocalizedString(@"Cancel", @"Cancel button")];
  [alert beginSheetModalForWindow:[NSApp keyWindow] completionHandler:^(NSModalResponse response) {
    if (response == NSAlertFirstButtonReturn) {
      completionHandler([textField stringValue]);
    } else {
      completionHandler(nil);
    }
  }];
#endif // !TARGET_OS_OSX
}

#if !TARGET_OS_OSX
/**
 * topViewController
 */
-(UIViewController *)topViewController{
    UIViewController *controller = [self topViewControllerWithRootViewController:[self getCurrentWindow].rootViewController];
    return controller;
}

/**
 * topViewControllerWithRootViewController
 */
-(UIViewController *)topViewControllerWithRootViewController:(UIViewController *)viewController{
  if (viewController==nil) return nil;
  if (viewController.presentedViewController!=nil) {
    return [self topViewControllerWithRootViewController:viewController.presentedViewController];
  } else if ([viewController isKindOfClass:[UITabBarController class]]){
    return [self topViewControllerWithRootViewController:[(UITabBarController *)viewController selectedViewController]];
  } else if ([viewController isKindOfClass:[UINavigationController class]]){
    return [self topViewControllerWithRootViewController:[(UINavigationController *)viewController visibleViewController]];
  } else {
    return viewController;
  }
}
/**
 * getCurrentWindow
 */
-(UIWindow *)getCurrentWindow{
  UIWindow *window = [UIApplication sharedApplication].keyWindow;
  if (window.windowLevel!=UIWindowLevelNormal) {
    for (UIWindow *wid in [UIApplication sharedApplication].windows) {
      if (window.windowLevel==UIWindowLevelNormal) {
        window = wid;
        break;
      }
    }
  }
  return window;
}
#endif // !TARGET_OS_OSX

/**
 * Decides whether to allow or cancel a navigation.
 * @see https://fburl.com/42r9fxob
 */
- (void)                  webView:(WKWebView *)webView
  decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction
                  decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler
{
  static NSDictionary<NSNumber *, NSString *> *navigationTypes;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    navigationTypes = @{
      @(WKNavigationTypeLinkActivated): @"click",
      @(WKNavigationTypeFormSubmitted): @"formsubmit",
      @(WKNavigationTypeBackForward): @"backforward",
      @(WKNavigationTypeReload): @"reload",
      @(WKNavigationTypeFormResubmitted): @"formresubmit",
      @(WKNavigationTypeOther): @"other",
    };
  });

  WKNavigationType navigationType = navigationAction.navigationType;
  NSURLRequest *request = navigationAction.request;

  if (_onShouldStartLoadWithRequest) {
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
      @"url": (request.URL).absoluteString,
      @"mainDocumentURL": (request.mainDocumentURL).absoluteString,
      @"navigationType": navigationTypes[@(navigationType)]
    }];
    if (![self.delegate webView:self
      shouldStartLoadForRequest:event
                   withCallback:_onShouldStartLoadWithRequest]) {
      decisionHandler(WKNavigationActionPolicyCancel);
      return;
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

  // Allow all navigation by default
  decisionHandler(WKNavigationActionPolicyAllow);
}

/**
 * Called when the web view’s content process is terminated.
 * @see https://developer.apple.com/documentation/webkit/wknavigationdelegate/1455639-webviewwebcontentprocessdidtermi?language=objc
 */
- (void)webViewWebContentProcessDidTerminate:(WKWebView *)webView
{
  RCTLogWarn(@"Webview Process Terminated");
  if (_onContentProcessDidTerminate) {
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    _onContentProcessDidTerminate(event);
  }
}

/**
 * Decides whether to allow or cancel a navigation after its response is known.
 * @see https://developer.apple.com/documentation/webkit/wknavigationdelegate/1455643-webview?language=objc
 */
- (void)                    webView:(WKWebView *)webView
  decidePolicyForNavigationResponse:(WKNavigationResponse *)navigationResponse
                    decisionHandler:(void (^)(WKNavigationResponsePolicy))decisionHandler
{
  WKNavigationResponsePolicy policy = WKNavigationResponsePolicyAllow;
  if (_onHttpError && navigationResponse.forMainFrame) {
    if ([navigationResponse.response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *response = (NSHTTPURLResponse *)navigationResponse.response;
      NSInteger statusCode = response.statusCode;

      if (statusCode >= 400) {
        NSMutableDictionary<NSString *, id> *httpErrorEvent = [self baseEvent];
        [httpErrorEvent addEntriesFromDictionary: @{
          @"url": response.URL.absoluteString,
          @"statusCode": @(statusCode)
        }];

        _onHttpError(httpErrorEvent);
      }

      NSString *disposition = nil;
      if (@available(iOS 13, *)) {
        disposition = [response valueForHTTPHeaderField:@"Content-Disposition"];
      }
      BOOL isAttachment = disposition != nil && [disposition hasPrefix:@"attachment"];
      if (isAttachment || !navigationResponse.canShowMIMEType) {
        if (_onFileDownload) {
          policy = WKNavigationResponsePolicyCancel;

          NSMutableDictionary<NSString *, id> *downloadEvent = [self baseEvent];
          [downloadEvent addEntriesFromDictionary: @{
            @"downloadUrl": (response.URL).absoluteString,
          }];
          _onFileDownload(downloadEvent);
        }
      }
    }
  }

  decisionHandler(policy);
}

/**
 * Called when an error occurs while the web view is loading content.
 * @see https://fburl.com/km6vqenw
 */
- (void)               webView:(WKWebView *)webView
  didFailProvisionalNavigation:(WKNavigation *)navigation
                     withError:(NSError *)error
{
  if (_onLoadingError) {
    if ([error.domain isEqualToString:NSURLErrorDomain] && error.code == NSURLErrorCancelled) {
      // NSURLErrorCancelled is reported when a page has a redirect OR if you load
      // a new URL in the WebView before the previous one came back. We can just
      // ignore these since they aren't real errors.
      // http://stackoverflow.com/questions/1024748/how-do-i-fix-nsurlerrordomain-error-999-in-iphone-3-0-os
      return;
    }

    if ([error.domain isEqualToString:@"WebKitErrorDomain"] && error.code == 102 || [error.domain isEqualToString:@"WebKitErrorDomain"] && error.code == 101) {
      // Error code 102 "Frame load interrupted" is raised by the WKWebView
      // when the URL is from an http redirect. This is a common pattern when
      // implementing OAuth with a WebView.
      return;
    }

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary:@{
      @"didFailProvisionalNavigation": @YES,
      @"domain": error.domain,
      @"code": @(error.code),
      @"description": error.localizedDescription,
    }];
    _onLoadingError(event);
  }
}

- (void)evaluateJS:(NSString *)js
          thenCall: (void (^)(NSString*)) callback
{
  [self.webView evaluateJavaScript: js completionHandler: ^(id result, NSError *error) {
    if (callback != nil) {
      callback([NSString stringWithFormat:@"%@", result]);
    }
    if (error != nil) {
      RCTLogWarn(@"%@", [NSString stringWithFormat:@"Error evaluating injectedJavaScript: This is possibly due to an unsupported return type. Try adding true to the end of your injectedJavaScript string. %@", error]);
    }
  }];
}

-(void)forceIgnoreSilentHardwareSwitch:(BOOL)initialSetup
{
    NSString *mp3Str = @"data:audio/mp3;base64,//tAxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAESAAzMzMzMzMzMzMzMzMzMzMzMzMzZmZmZmZmZmZmZmZmZmZmZmZmZmaZmZmZmZmZmZmZmZmZmZmZmZmZmczMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////8AAAA5TEFNRTMuMTAwAZYAAAAAAAAAABQ4JAMGQgAAOAAABEhNIZS0AAAAAAD/+0DEAAPH3Yz0AAR8CPqyIEABp6AxjG/4x/XiInE4lfQDFwIIRE+uBgZoW4RL0OLMDFn6E5v+/u5ehf76bu7/6bu5+gAiIQGAABQIUJ0QolFghEn/9PhZQpcUTpXMjo0OGzRCZXyKxoIQzB2KhCtGobpT9TRVj/3Pmfp+f8X7Pu1B04sTnc3s0XhOlXoGVCMNo9X//9/r6a10TZEY5DsxqvO7mO5qFvpFCmKIjhpSItGsUYcRO//7QsQRgEiljQIAgLFJAbIhNBCa+JmorCbOi5q9nVd2dKnusTMQg4MFUlD6DQ4OFijwGAijRMfLbHG4nLVTjydyPlJTj8pfPflf9/5GD950A5e+jsrmNZSjSirjs1R7hnkia8vr//l/7Nb+crvr9Ok5ZJOylUKRxf/P9Zn0j2P4pJYXyKkeuy5wUYtdmOu6uobEtFqhIJViLEKIjGxchGev/L3Y0O3bwrIOszTBAZ7Ih28EUaSOZf/7QsQfg8fpjQIADN0JHbGgQBAZ8T//y//t/7d/2+f5m7MdCeo/9tdkMtGLbt1tqnabRroO1Qfvh20yEbei8nfDXP7btW7f9/uO9tbe5IvHQbLlxpf3DkAk0ojYcv///5/u3/7PTfGjPEPUvt5D6f+/3Lea4lz4tc4TnM/mFPrmalWbboeNiNyeyr+vufttZuvrVrt/WYv3T74JFo8qEDiJqJrmDTs///v99xDku2xG02jjunrICP/7QsQtA8kpkQAAgNMA/7FgQAGnobgfghgqA+uXwWQ3XFmGimSbe2X3ksY//KzK1a2k6cnNWOPJnPWUsYbKqkh8RJzrVf///P///////4vyhLKHLrCb5nIrYIUss4cthigL1lQ1wwNAc6C1pf1TIKRSkt+a//z+yLVcwlXKSqeSuCVQFLng2h4AFAFgTkH+Z/8jTX/zr//zsJV/5f//5UX/0ZNCNCCaf5lTCTRkaEdhNP//n/KUjf/7QsQ5AEhdiwAAjN7I6jGddBCO+WGTQ1mXrYatSAgaykxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==";
    NSString *scr;
    if (initialSetup) {
        scr = [NSString stringWithFormat:@"var s=new Audio('%@');s.id='wkwebviewAudio';s.controls=false;s.loop=true;s.play();document.body.appendChild(s);true", mp3Str];
    } else {
        scr = [NSString stringWithFormat:@"var s=document.getElementById('wkwebviewAudio');s.src=null;s.parentNode.removeChild(s);s=null;s=new Audio('%@');s.id='wkwebviewAudio';s.controls=false;s.loop=true;s.play();document.body.appendChild(s);true", mp3Str];
    }
    [self evaluateJS: scr thenCall: nil];
}

-(void)disableIgnoreSilentSwitch
{
    [self evaluateJS: @"document.getElementById('wkwebviewAudio').src=null;true" thenCall: nil];
}

-(void)appDidBecomeActive
{
    if (_ignoreSilentHardwareSwitch) {
      [self forceIgnoreSilentHardwareSwitch:false];
    }
}

-(void)appWillResignActive
{
  if (_ignoreSilentHardwareSwitch) {
    [self disableIgnoreSilentSwitch];
  }
}

/**
 * Called when the navigation is complete.
 * @see https://fburl.com/rtys6jlb
 */
- (void)webView:(WKWebView *)webView
  didFinishNavigation:(WKNavigation *)navigation
{
  if (_ignoreSilentHardwareSwitch) {
    [self forceIgnoreSilentHardwareSwitch:true];
  }
    
  if (_onLoadingFinish) {
    _onLoadingFinish([self baseEvent]);
  }
}

- (void)injectJavaScript:(NSString *)script
{
  [self evaluateJS: script thenCall: nil];
}

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
  /**
   * When the initial load fails due to network connectivity issues,
   * [_webView reload] doesn't reload the webpage. Therefore, we must
   * manually call [_webView loadRequest:request].
   */
  NSURLRequest *request = [self requestForSource:self.source];

  if (request.URL && !_webView.URL.absoluteString.length) {
    [_webView loadRequest:request];
  } else {
    [_webView reload];
  }
}

- (void)stopLoading
{
  [_webView stopLoading];
}

#if !TARGET_OS_OSX
- (void)setBounces:(BOOL)bounces
{
  _bounces = bounces;
  _webView.scrollView.bounces = bounces;
}
#endif // !TARGET_OS_OSX


- (void)setInjectedJavaScript:(NSString *)source {
  _injectedJavaScript = source;
  
  self.atEndScript = source == nil ? nil : [[WKUserScript alloc] initWithSource:source
      injectionTime:WKUserScriptInjectionTimeAtDocumentEnd
    forMainFrameOnly:_injectedJavaScriptForMainFrameOnly];
  
  if(_webView != nil){
    [self resetupScripts:_webView.configuration];
  }
}

- (void)setInjectedJavaScriptBeforeContentLoaded:(NSString *)source {
  _injectedJavaScriptBeforeContentLoaded = source;
  
  self.atStartScript = source == nil ? nil : [[WKUserScript alloc] initWithSource:source
       injectionTime:WKUserScriptInjectionTimeAtDocumentStart
    forMainFrameOnly:_injectedJavaScriptBeforeContentLoadedForMainFrameOnly];
  
  if(_webView != nil){
    [self resetupScripts:_webView.configuration];
  }
}

- (void)setInjectedJavaScriptForMainFrameOnly:(BOOL)mainFrameOnly {
  _injectedJavaScriptForMainFrameOnly = mainFrameOnly;
  [self setInjectedJavaScript:_injectedJavaScript];
}

- (void)setInjectedJavaScriptBeforeContentLoadedForMainFrameOnly:(BOOL)mainFrameOnly {
  _injectedJavaScriptBeforeContentLoadedForMainFrameOnly = mainFrameOnly;
  [self setInjectedJavaScriptBeforeContentLoaded:_injectedJavaScriptBeforeContentLoaded];
}

- (void)setMessagingEnabled:(BOOL)messagingEnabled {
  _messagingEnabled = messagingEnabled;
  
  self.postMessageScript = _messagingEnabled ?
  [
   [WKUserScript alloc]
   initWithSource: [
                    NSString
                    stringWithFormat:
                    @"window.%@ = {"
                    "  postMessage: function (data) {"
                    "    window.webkit.messageHandlers.%@.postMessage(String(data));"
                    "  }"
                    "};", MessageHandlerName, MessageHandlerName
                    ]
   injectionTime:WKUserScriptInjectionTimeAtDocumentStart
   /* TODO: For a separate (minor) PR: use logic like this (as react-native-wkwebview does) so that messaging can be used in all frames if desired.
    *       I am keeping it as YES for consistency with previous behaviour. */
   // forMainFrameOnly:_messagingEnabledForMainFrameOnly
   forMainFrameOnly:YES
   ] :
  nil;
  
  if(_webView != nil){
    [self resetupScripts:_webView.configuration];
  }
}

- (void)resetupScripts:(WKWebViewConfiguration *)wkWebViewConfig {
  [wkWebViewConfig.userContentController removeAllUserScripts];
  [wkWebViewConfig.userContentController removeScriptMessageHandlerForName:MessageHandlerName];
  
  NSString *html5HistoryAPIShimSource = [NSString stringWithFormat:
    @"(function(history) {\n"
    "  function notify(type) {\n"
    "    setTimeout(function() {\n"
    "      window.webkit.messageHandlers.%@.postMessage(type)\n"
    "    }, 0)\n"
    "  }\n"
    "  function shim(f) {\n"
    "    return function pushState() {\n"
    "      notify('other')\n"
    "      return f.apply(history, arguments)\n"
    "    }\n"
    "  }\n"
    "  history.pushState = shim(history.pushState)\n"
    "  history.replaceState = shim(history.replaceState)\n"
    "  window.addEventListener('popstate', function() {\n"
    "    notify('backforward')\n"
    "  })\n"
    "})(window.history)\n", HistoryShimName
  ];
  WKUserScript *script = [[WKUserScript alloc] initWithSource:html5HistoryAPIShimSource injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES];
  [wkWebViewConfig.userContentController addUserScript:script];
  
  if(_sharedCookiesEnabled) {
    // More info to sending cookies with WKWebView
    // https://stackoverflow.com/questions/26573137/can-i-set-the-cookies-to-be-used-by-a-wkwebview/26577303#26577303
    if (@available(iOS 11.0, *)) {
      // Set Cookies in iOS 11 and above, initialize websiteDataStore before setting cookies
      // See also https://forums.developer.apple.com/thread/97194
      // check if websiteDataStore has not been initialized before
      if(!_incognito && !_cacheEnabled) {
        wkWebViewConfig.websiteDataStore = [WKWebsiteDataStore nonPersistentDataStore];
      }
      for (NSHTTPCookie *cookie in [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookies]) {
        [wkWebViewConfig.websiteDataStore.httpCookieStore setCookie:cookie completionHandler:nil];
      }
    } else {
      NSMutableString *script = [NSMutableString string];

      // Clear all existing cookies in a direct called function. This ensures that no
      // javascript error will break the web content javascript.
      // We keep this code here, if someone requires that Cookies are also removed within the
      // the WebView and want to extends the current sharedCookiesEnabled option with an
      // additional property.
      // Generates JS: document.cookie = "key=; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
      // for each cookie which is already available in the WebView context.
      /*
      [script appendString:@"(function () {\n"];
      [script appendString:@"  var cookies = document.cookie.split('; ');\n"];
      [script appendString:@"  for (var i = 0; i < cookies.length; i++) {\n"];
      [script appendString:@"    if (cookies[i].indexOf('=') !== -1) {\n"];
      [script appendString:@"      document.cookie = cookies[i].split('=')[0] + '=; Expires=Thu, 01 Jan 1970 00:00:01 GMT';\n"];
      [script appendString:@"    }\n"];
      [script appendString:@"  }\n"];
      [script appendString:@"})();\n\n"];
      */

      // Set cookies in a direct called function. This ensures that no
      // javascript error will break the web content javascript.
        // Generates JS: document.cookie = "key=value; Path=/; Expires=Thu, 01 Jan 20xx 00:00:01 GMT;"
      // for each cookie which is available in the application context.
      [script appendString:@"(function () {\n"];
      for (NSHTTPCookie *cookie in [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookies]) {
        [script appendFormat:@"document.cookie = %@ + '=' + %@",
          RCTJSONStringify(cookie.name, NULL),
          RCTJSONStringify(cookie.value, NULL)];
        if (cookie.path) {
          [script appendFormat:@" + '; Path=' + %@", RCTJSONStringify(cookie.path, NULL)];
        }
        if (cookie.expiresDate) {
          [script appendFormat:@" + '; Expires=' + new Date(%f).toUTCString()",
            cookie.expiresDate.timeIntervalSince1970 * 1000
          ];
        }
        [script appendString:@";\n"];
      }
      [script appendString:@"})();\n"];

      WKUserScript* cookieInScript = [[WKUserScript alloc] initWithSource:script
                                                            injectionTime:WKUserScriptInjectionTimeAtDocumentStart
                                                         forMainFrameOnly:YES];
      [wkWebViewConfig.userContentController addUserScript:cookieInScript];
    }
  }
  
  if(_messagingEnabled){
    if (self.postMessageScript){
      [wkWebViewConfig.userContentController addScriptMessageHandler:[[RNCWeakScriptMessageDelegate alloc] initWithDelegate:self]
                                                                       name:MessageHandlerName];
      [wkWebViewConfig.userContentController addUserScript:self.postMessageScript];
    }
    if (self.atEndScript) {
      [wkWebViewConfig.userContentController addUserScript:self.atEndScript];
    }
  }
  // Whether or not messaging is enabled, add the startup script if it exists.
  if (self.atStartScript) {
    [wkWebViewConfig.userContentController addUserScript:self.atStartScript];
  }
}

- (NSURLRequest *)requestForSource:(id)json {
  NSURLRequest *request = [RCTConvert NSURLRequest:self.source];

  // If sharedCookiesEnabled we automatically add all application cookies to the
  // http request. This is automatically done on iOS 11+ in the WebView constructor.
  // Se we need to manually add these shared cookies here only for iOS versions < 11.
  if (_sharedCookiesEnabled) {
    if (@available(iOS 11.0, *)) {
      // see WKWebView initialization for added cookies
    } else {
      NSArray *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:request.URL];
      NSDictionary<NSString *, NSString *> *cookieHeader = [NSHTTPCookie requestHeaderFieldsWithCookies:cookies];
      NSMutableURLRequest *mutableRequest = [request mutableCopy];
      [mutableRequest setAllHTTPHeaderFields:cookieHeader];
      return mutableRequest;
    }
  }
  return request;
}

@end

@implementation RNCWeakScriptMessageDelegate

- (instancetype)initWithDelegate:(id<WKScriptMessageHandler>)scriptDelegate {
    self = [super init];
    if (self) {
        _scriptDelegate = scriptDelegate;
    }
    return self;
}

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    [self.scriptDelegate userContentController:userContentController didReceiveScriptMessage:message];
}

@end

