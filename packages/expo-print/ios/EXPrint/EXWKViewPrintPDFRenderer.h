// Copyright 2021-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>
#import <EXPrint/EXWKPDFRenderer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXWKViewPrintPDFRenderer : NSObject <EXPDFRenderer>

- (instancetype)initWithPageSize:(CGSize)pageSize pageMargins:(UIEdgeInsets)pageMargins;

- (void)PDFFromWebView:(WKWebView *)webView completionHandler:(void(^_Nullable)(NSError * _Nullable, NSData * _Nullable, int))handler API_AVAILABLE(ios(8.0));

@end

NS_ASSUME_NONNULL_END
