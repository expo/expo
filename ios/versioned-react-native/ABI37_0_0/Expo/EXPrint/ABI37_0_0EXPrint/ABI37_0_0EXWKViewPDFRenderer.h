// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>
#import <ABI37_0_0EXPrint/ABI37_0_0EXWKPDFRenderer.h>

NS_ASSUME_NONNULL_BEGIN

// View snapshot based implementation required for iOS < 11.0.
// In iOS 11 Apple added -(void)takeSnapshot... method to WKWebView which allows us to implement
// same functionality in ABI37_0_0EXWKSnapshotPDFRenderer. This renderer should only be used in iOS < 11.

// This renderer mounts given web view in view hierarchy outside of visible area.

@interface ABI37_0_0EXWKViewPDFRenderer : NSObject <ABI37_0_0EXPDFRenderer>

- (void)PDFFromWebView:(WKWebView *)webView completionHandler:(void(^_Nullable)(NSError * _Nullable, NSData * _Nullable, int))handler;

@end

NS_ASSUME_NONNULL_END
