// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>
#import <ABI37_0_0EXPrint/ABI37_0_0EXWKPDFRenderer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI37_0_0EXWKSnapshotPDFRenderer : NSObject <ABI37_0_0EXPDFRenderer>

- (void)PDFFromWebView:(WKWebView *)webView completionHandler:(void(^_Nullable)(NSError * _Nullable, NSData * _Nullable, int))handler API_AVAILABLE(ios(11.0));

@end

NS_ASSUME_NONNULL_END
