/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI17_0_0/ABI17_0_0RCTView.h>

@class ABI17_0_0RCTWebView;

/**
 * Special scheme used to pass messages to the injectedJavaScript
 * code without triggering a page load. Usage:
 *
 *   window.location.href = ABI17_0_0RCTJSNavigationScheme + '://hello'
 */
extern NSString *const ABI17_0_0RCTJSNavigationScheme;

@protocol ABI17_0_0RCTWebViewDelegate <NSObject>

- (BOOL)webView:(ABI17_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI17_0_0RCTDirectEventBlock)callback;

@end

@interface ABI17_0_0RCTWebView : ABI17_0_0RCTView

@property (nonatomic, weak) id<ABI17_0_0RCTWebViewDelegate> delegate;

@property (nonatomic, copy) NSDictionary *source;
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, assign) BOOL messagingEnabled;
@property (nonatomic, copy) NSString *injectedJavaScript;
@property (nonatomic, assign) BOOL scalesPageToFit;

- (void)goForward;
- (void)goBack;
- (void)reload;
- (void)stopLoading;
- (void)postMessage:(NSString *)message;
- (void)injectJavaScript:(NSString *)script;

@end
