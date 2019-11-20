// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXPDFRenderer <NSObject>

- (void)PDFFromWebView:(WKWebView *)webView completionHandler:(void (^)(NSError * _Nullable, NSData * _Nullable, int))handler;

@end

@interface EXWKPDFRenderer : NSObject

- (void)PDFWithHtml:(NSString *)htmlString pageSize:(CGSize)pageSize completionHandler:(void(^_Nullable)(NSError * _Nullable, NSData * _Nullable, int))handler;

@end

NS_ASSUME_NONNULL_END
