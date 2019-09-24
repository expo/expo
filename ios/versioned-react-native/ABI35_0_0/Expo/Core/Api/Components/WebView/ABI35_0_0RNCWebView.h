/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI35_0_0/ABI35_0_0RCTView.h>
#import <ReactABI35_0_0/ABI35_0_0RCTDefines.h>
#import <WebKit/WebKit.h>

@class ABI35_0_0RNCWebView;

@protocol ABI35_0_0RNCWebViewDelegate <NSObject>

- (BOOL)webView:(ABI35_0_0RNCWebView *)webView
   shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI35_0_0RCTDirectEventBlock)callback;

@end

@interface ABI35_0_0RNCWebView : ABI35_0_0RCTView

@property (nonatomic, strong) NSString *experienceId;

@property (nonatomic, weak) id<ABI35_0_0RNCWebViewDelegate> delegate;
@property (nonatomic, copy) NSDictionary *source;
@property (nonatomic, assign) BOOL messagingEnabled;
@property (nonatomic, copy) NSString *injectedJavaScript;
@property (nonatomic, assign) BOOL scrollEnabled;
@property (nonatomic, assign) BOOL sharedCookiesEnabled;
@property (nonatomic, assign) BOOL pagingEnabled;
@property (nonatomic, assign) CGFloat decelerationRate;
@property (nonatomic, assign) BOOL allowsInlineMediaPlayback;
@property (nonatomic, assign) BOOL bounces;
@property (nonatomic, assign) BOOL mediaPlaybackRequiresUserAction;
#if WEBKIT_IOS_10_APIS_AVAILABLE
@property (nonatomic, assign) WKDataDetectorTypes dataDetectorTypes;
#endif
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, assign) BOOL keyboardDisplayRequiresUserAction;
@property (nonatomic, assign) BOOL hideKeyboardAccessoryView;
@property (nonatomic, assign) BOOL allowsBackForwardNavigationGestures;
@property (nonatomic, assign) BOOL incognito;
@property (nonatomic, assign) BOOL useSharedProcessPool;
@property (nonatomic, copy) NSString *userAgent;
@property (nonatomic, copy) NSString *applicationNameForUserAgent;
@property (nonatomic, assign) BOOL cacheEnabled;
@property (nonatomic, assign) BOOL javaScriptEnabled;
@property (nonatomic, assign) BOOL allowsLinkPreview;
@property (nonatomic, assign) BOOL showsHorizontalScrollIndicator;
@property (nonatomic, assign) BOOL showsVerticalScrollIndicator;
@property (nonatomic, assign) BOOL directionalLockEnabled;
@property (nonatomic, copy) NSString *allowingReadAccessToURL;

+ (void)setClientAuthenticationCredential:(nullable NSURLCredential*)credential;
- (void)postMessage:(NSString *)message;
- (void)injectJavaScript:(NSString *)script;
- (void)goForward;
- (void)goBack;
- (void)reload;
- (void)stopLoading;

@end
