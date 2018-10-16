// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import <EXPrint/EXPrintPDFRenderTask.h>

#define kLetterPaperSize CGSizeMake(612, 792)

@interface EXPrintPDFRenderTask () <UIWebViewDelegate>

@property (nonatomic, strong) UIWebView *webView;
@property (nonatomic, strong) void (^onRenderingFinished)(NSData *);

@end

@implementation EXPrintPDFRenderTask

- (void)renderWithOptions:(nonnull NSDictionary *)options completionHandler:(void(^)(NSData *))handler
{
  if (_webView != nil) {
    return;
  }
  
  NSString *htmlString = @"";
  
  // defaults to pixel size for A4 paper format with 72 PPI
  _paperRect = CGRectMake(0, 0, kLetterPaperSize.width, kLetterPaperSize.height);
  
  if (options[@"html"] != nil) {
    htmlString = options[@"html"];
  }
  
  if (options[@"width"] != nil) {
    _paperRect.size.width = [(NSNumber *)options[@"width"] floatValue];
  }
  
  if (options[@"height"] != nil) {
    _paperRect.size.height = [(NSNumber *)options[@"height"] floatValue];
  }
  
  if ([options[@"orientation"] isEqualToString:@"landscape"]) {
    // Make height the lesser dimension if the orientation is landscape.
    _paperRect.size = CGSizeMake(
                                 fmax(_paperRect.size.width, _paperRect.size.height),
                                 fmin(_paperRect.size.width, _paperRect.size.height)
                                 );
  }
  
  _onRenderingFinished = handler;
  
  _webView = [[UIWebView alloc] initWithFrame:_paperRect];
  _webView.delegate = self;
  _webView.opaque = NO;
  _webView.backgroundColor = [UIColor clearColor];
  _webView.scrollView.showsHorizontalScrollIndicator = NO;
  _webView.scrollView.showsVerticalScrollIndicator = NO;
  
  [_webView loadHTMLString:htmlString baseURL:nil];
}

- (NSData *)printToPDF
{
  int pageHeight = _paperRect.size.height;
  int scrollHeight = [[_webView stringByEvaluatingJavaScriptFromString:@"document.body.scrollHeight;"] intValue];
  
  _numberOfPages = ceil(scrollHeight / _paperRect.size.height);
  
  NSMutableData *pdfData = [NSMutableData data];
  UIGraphicsBeginPDFContextToData(pdfData, _paperRect, nil);
  
  for (int i = 0 ; i < _numberOfPages; i++) {
    // Check to see if page draws more than the height of the UIWebView,
    // then we have to reduce frame's height to get rid of the default gray background.
    if ((i + 1) * pageHeight > scrollHeight) {
      CGRect frame = [_webView frame];
      frame.size.height -= (i + 1) * pageHeight - scrollHeight;
      [_webView setFrame:frame];
    }
    
    UIGraphicsBeginPDFPage();
    CGContextRef currentContext = UIGraphicsGetCurrentContext();
    
    [[[_webView subviews] lastObject] setContentOffset:CGPointMake(0, pageHeight * i) animated:NO];
    [_webView.layer renderInContext:currentContext];
  }
  
  UIGraphicsEndPDFContext();
  return pdfData;
}

#pragma mark - UIWebViewDelegate

- (void)webViewDidFinishLoad:(UIWebView *)webView
{
  if (webView.isLoading) {
    return;
  }
  
  NSData *pdfData = [self printToPDF];
  
  if (_onRenderingFinished != nil) {
    _onRenderingFinished(pdfData);
  }
}

@end
