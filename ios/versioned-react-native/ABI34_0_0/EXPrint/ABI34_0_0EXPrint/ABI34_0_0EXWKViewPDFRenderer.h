// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>
#import <ABI34_0_0EXPrint/ABI34_0_0EXWKPDFRenderer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI34_0_0EXWKViewPDFRenderer : NSObject <ABI34_0_0EXPDFRenderer>

- (void)PDFFromWebView:(WKWebView *)webView completionHandler:(void(^_Nullable)(NSError * _Nullable, NSData * _Nullable, int))handler;

@end

NS_ASSUME_NONNULL_END
