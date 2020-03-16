/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTView.h>
#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>
#import <WebKit/WebKit.h>

@class ABI37_0_0RNCWebView;

@protocol ABI37_0_0RNCWebViewDelegate <NSObject>

- (BOOL)webView:(ABI37_0_0RNCWebView *_Nonnull)webView
   shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *_Nonnull)request
   withCallback:(ABI37_0_0RCTDirectEventBlock _Nonnull)callback;

@end

@interface ABI37_0_0RNCWeakScriptMessageDelegate : NSObject<WKScriptMessageHandler>
@property (nonatomic, weak) id<WKScriptMessageHandler> scriptDelegate;
- (instancetype)initWithDelegate:(id<WKScriptMessageHandler>)scriptDelegate;
@end

@interface ABI37_0_0RNCWebView : ABI37_0_0RCTView

@property (nonatomic, weak) id<ABI37_0_0RNCWebViewDelegate> _Nullable delegate;
@property (nonatomic, copy) NSDictionary * _Nullable source;
@property (nonatomic, assign) BOOL messagingEnabled;
@property (nonatomic, copy) NSString * _Nullable injectedJavaScript;
@property (nonatomic, copy) NSString * _Nullable injectedJavaScriptBeforeContentLoaded;
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
@property (nonatomic, copy) NSString * _Nullable userAgent;
@property (nonatomic, copy) NSString * _Nullable applicationNameForUserAgent;
@property (nonatomic, assign) BOOL cacheEnabled;
@property (nonatomic, assign) BOOL javaScriptEnabled;
@property (nonatomic, assign) BOOL allowFileAccessFromFileURLs;
@property (nonatomic, assign) BOOL allowsLinkPreview;
@property (nonatomic, assign) BOOL showsHorizontalScrollIndicator;
@property (nonatomic, assign) BOOL showsVerticalScrollIndicator;
@property (nonatomic, assign) BOOL directionalLockEnabled;
@property (nonatomic, copy) NSString * _Nullable allowingReadAccessToURL;

+ (void)setClientAuthenticationCredential:(nullable NSURLCredential*)credential;
+ (void)setCustomCertificatesForHost:(nullable NSDictionary *)certificates;
- (void)postMessage:(NSString *_Nullable)message;
- (void)injectJavaScript:(NSString *_Nullable)script;
- (void)goForward;
- (void)goBack;
- (void)reload;
- (void)stopLoading;

@end
