#import <ReactABI33_0_0/ABI33_0_0RCTView.h>

@class ABI33_0_0RNCUIWebView;

/**
 * Special scheme used to pass messages to the injectedJavaScript
 * code without triggering a page load. Usage:
 *
 *   window.location.href = ABI33_0_0RNCJSNavigationScheme + '://hello'
 */
extern NSString *const ABI33_0_0RNCJSNavigationScheme;

@protocol ABI33_0_0RNCUIWebViewDelegate <NSObject>

- (BOOL)webView:(ABI33_0_0RNCUIWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI33_0_0RCTDirectEventBlock)callback;

@end

@interface ABI33_0_0RNCUIWebView : ABI33_0_0RCTView

@property (nonatomic, weak) id<ABI33_0_0RNCUIWebViewDelegate> delegate;

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
