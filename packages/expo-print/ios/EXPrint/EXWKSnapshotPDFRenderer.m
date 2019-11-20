// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXPrint/EXWKSnapshotPDFRenderer.h>
#import <UMCore/UMDefines.h>

@interface EXWKSnapshotPDFRenderer ()

@end

@implementation EXWKSnapshotPDFRenderer

- (void)PDFFromWebView:(WKWebView *)webView completionHandler:(void (^)(NSError * _Nullable, NSData * _Nullable, int))handler
{
  UM_WEAKIFY(self);
  [webView evaluateJavaScript:@"document.body.scrollHeight;" completionHandler:^(id jsValue, NSError * _Nullable error) {
    UM_ENSURE_STRONGIFY(self);
    CGFloat scrollHeight = [jsValue doubleValue];
    CGFloat pageHeight = webView.bounds.size.height;
    int numberOfPages = ceil(scrollHeight / pageHeight);

    // Ensure all content is loaded by scrolling to the end of webpage
    [webView.scrollView setContentOffset:CGPointMake(0, scrollHeight - pageHeight) animated:NO];

    NSMutableData *pdfData = [NSMutableData data];
    UIGraphicsBeginPDFContextToData(pdfData, webView.bounds, nil);
    [self takeSnapshotForPage:0 ofPages:numberOfPages ofWebView:webView withScrollHeight:scrollHeight withCompletionHandler:^(NSError * _Nullable error) {
      UIGraphicsEndPDFContext();
      if (error) {
        handler(error, nil, 0);
      } else {
        handler(nil, pdfData, numberOfPages);
      }
    }];
  }];
}

- (void)takeSnapshotForPage:(int)pageIndex ofPages:(int)pagesCount ofWebView:(WKWebView *)webView withScrollHeight:(CGFloat)scrollHeight withCompletionHandler:(void (^ _Nullable)(NSError * _Nullable error))completionHandler
{
  if (pageIndex >= pagesCount) {
    completionHandler(nil);
    return;
  }

  CGFloat pageHeight = webView.bounds.size.height;

  [webView.scrollView setContentOffset:CGPointMake(0, pageHeight * pageIndex) animated:NO];
  if (@available(iOS 11.0, *)) {
    [webView takeSnapshotWithConfiguration:nil completionHandler:^(UIImage * _Nullable snapshotImage, NSError * _Nullable error) {
      if (snapshotImage) {
        CGRect printRect = UIGraphicsGetPDFContextBounds();
        UIGraphicsBeginPDFPage();
        [snapshotImage drawInRect:printRect];
        [self takeSnapshotForPage:(pageIndex + 1) ofPages:pagesCount ofWebView:webView withScrollHeight:scrollHeight withCompletionHandler:completionHandler];
      } else {
        completionHandler(error);
      }
    }];
  } else {
    NSError *error = UMErrorWithMessage(@"Unexpected error occurred - on iOS under 11.0 use EXWKViewPDFRenderer.");
    completionHandler(error);
  }
}

@end
