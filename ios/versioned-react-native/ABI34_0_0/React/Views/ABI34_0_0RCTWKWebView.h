/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI34_0_0/ABI34_0_0RCTView.h>
#import <ReactABI34_0_0/ABI34_0_0RCTDefines.h>
#import <WebKit/WebKit.h>

@class ABI34_0_0RCTWKWebView;

@protocol ABI34_0_0RCTWKWebViewDelegate <NSObject>

- (BOOL)webView:(ABI34_0_0RCTWKWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI34_0_0RCTDirectEventBlock)callback;

@end

@interface ABI34_0_0RCTWKWebView : ABI34_0_0RCTView

@property (nonatomic, weak) id<ABI34_0_0RCTWKWebViewDelegate> delegate;
@property (nonatomic, copy) NSDictionary *source;
@property (nonatomic, assign) BOOL messagingEnabled;
@property (nonatomic, copy) NSString *injectedJavaScript;
@property (nonatomic, assign) BOOL scrollEnabled;
@property (nonatomic, assign) CGFloat decelerationRate;
@property (nonatomic, assign) BOOL allowsInlineMediaPlayback;
@property (nonatomic, assign) BOOL bounces;
@property (nonatomic, assign) BOOL mediaPlaybackRequiresUserAction;
#if WEBKIT_IOS_10_APIS_AVAILABLE
@property (nonatomic, assign) WKDataDetectorTypes dataDetectorTypes;
#endif
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;

+ (void)setClientAuthenticationCredential:(nullable NSURLCredential*)credential;
- (void)postMessage:(NSString *)message;
- (void)injectJavaScript:(NSString *)script;
- (void)goForward;
- (void)goBack;
- (void)reload;
- (void)stopLoading;

@end
