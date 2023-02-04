// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI48_0_0EXPDFRenderer <NSObject>

- (void)PDFFromWebView:(WKWebView *)webView completionHandler:(void (^)(NSError * _Nullable, NSData * _Nullable, int))handler;

@end

@interface ABI48_0_0EXWKPDFRenderer : NSObject

- (void)PDFWithHtml:(NSString *)htmlString pageSize:(CGSize)pageSize pageMargins:(UIEdgeInsets)pageMargins completionHandler:(void(^_Nullable)(NSError * _Nullable, NSData * _Nullable, int))handler;

@end

NS_ASSUME_NONNULL_END
