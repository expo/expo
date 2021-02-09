// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXPrint/EXWKViewPDFRenderer.h>
#import <UMCore/UMDefines.h>

@interface EXWKViewPDFRenderer ()

@property (nonatomic, strong) UIView *containerView;

@end

@implementation EXWKViewPDFRenderer

- (instancetype)init
{
  if (self = [super init]) {
    _containerView = [[UIView alloc] initWithFrame:CGRectZero];
    [_containerView setClipsToBounds:NO];
  }
  return self;
}

- (void)PDFFromWebView:(WKWebView *)webView completionHandler:(void (^)(NSError * _Nullable, NSData * _Nullable, int))handler
{
  CGRect initialFrame = webView.frame;
  UIView *initialSuperview = webView.superview;
  CGPoint initialContentOffset = webView.scrollView.contentOffset;
  NSUInteger initialIndex = [webView.superview.subviews indexOfObject:webView];

  // Attach WebView to view hierarchy - otherwise nothing is rendered
  UIWindow *window = [UIApplication sharedApplication].keyWindow;
  CGRect containerFrame = CGRectMake(window.bounds.size.width, 0, webView.frame.size.width, webView.frame.size.height);
  [_containerView setFrame:containerFrame];
  CGRect webViewFrame = CGRectMake(0, 0, webView.frame.size.width, webView.frame.size.height);
  [_containerView addSubview:webView];
  [webView setFrame:webViewFrame];
  [webView.scrollView setClipsToBounds:NO];
  [window addSubview:_containerView];

  UM_WEAKIFY(self);
  // Questionable dispatch_after. Simple dispatch_async doesn't work, only divs are rendered properly then.
  // (Tested with some position:absolute colorful divs) Text is rendered only when dispatched after a timeout.
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [webView evaluateJavaScript:@"document.body.scrollHeight;" completionHandler:^(id jsValue, NSError * _Nullable error) {
      UM_ENSURE_STRONGIFY(self);
      CGFloat scrollHeight = [jsValue doubleValue];
      CGFloat pageHeight = self.containerView.bounds.size.height;
      int numberOfPages = ceil(scrollHeight / pageHeight);
      [webView setFrame:CGRectMake(0, 0, webView.frame.size.width, scrollHeight)];

      // Ensure all content is loaded by scrolling to the end of webpage
      [webView.scrollView setContentOffset:CGPointMake(0, scrollHeight - pageHeight) animated:NO];
      [webView.scrollView setContentOffset:CGPointZero animated:NO];

      NSMutableData *pdfData = [NSMutableData data];
      UIGraphicsBeginPDFContextToData(pdfData, self.containerView.bounds, nil);
      [self takeSnapshotForPage:0 ofPages:numberOfPages ofWebView:webView withScrollHeight:scrollHeight withCompletionHandler:^(NSError * _Nullable error) {
        UM_ENSURE_STRONGIFY(self);
        [self.containerView removeFromSuperview];
        [webView removeFromSuperview];
        [webView setFrame:initialFrame];
        [webView.scrollView setContentOffset:initialContentOffset animated:NO];
        [initialSuperview insertSubview:webView atIndex:initialIndex];
        UIGraphicsEndPDFContext();
        if (error) {
          handler(error, nil, 0);
        } else {
          handler(nil, pdfData, numberOfPages);
        }
      }];
    }];
  });
}

- (void)takeSnapshotForPage:(int)pageIndex ofPages:(int)pagesCount ofWebView:(WKWebView *)webView withScrollHeight:(CGFloat)scrollHeight withCompletionHandler:(void (^ _Nullable)(NSError * _Nullable error))completionHandler
{
  if (pageIndex >= pagesCount) {
    completionHandler(nil);
    return;
  }

  CGRect printRect = UIGraphicsGetPDFContextBounds();
  CGFloat pageHeight = printRect.size.height;

  CGRect newFrame = CGRectMake(webView.frame.origin.x, -pageHeight * pageIndex, webView.frame.size.width, webView.frame.size.height);
  [webView setFrame:newFrame];

  UIGraphicsBeginPDFPage();
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:printRect.size];
  UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext * _Nonnull rendererContext) {
    UIView *snapshotView = [_containerView snapshotViewAfterScreenUpdates:YES];
    [snapshotView drawViewHierarchyInRect:printRect afterScreenUpdates:YES];
  }];
  [image drawInRect:printRect];

  [self takeSnapshotForPage:(pageIndex + 1) ofPages:pagesCount ofWebView:webView withScrollHeight:scrollHeight withCompletionHandler:completionHandler];
}

@end
