//
//  ABI29_0_0EXPrintPDFRenderTask.m
//  Exponent
//
//  Created by Tomasz Sapeta on 23/05/2018.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>

#import "ABI29_0_0EXPrintPDFRenderTask.h"

#define kLetterPaperSize CGSizeMake(612, 792)

@interface ABI29_0_0EXPrintPDFRenderTask () <UIWebViewDelegate>

@property (nonatomic, strong) UIWebView *webView;
@property (nonatomic, strong) void (^onRenderingFinished)(NSData *);

@end

@implementation ABI29_0_0EXPrintPDFRenderTask

- (void)renderWithOptions:(nonnull NSDictionary *)options completionHandler:(void(^)(NSData *))handler
{
  if (_webView != nil) {
    return;
  }
  
  NSString *htmlString = @"";
  
  // defaults to pixel size for A4 paper format with 72 PPI
  _paperRect = CGRectMake(0, 0, kLetterPaperSize.width, kLetterPaperSize.height);
  
  if (options[@"html"] != nil) {
    htmlString = [ABI29_0_0RCTConvert NSString:options[@"html"]];
  }
  
  if (options[@"width"] != nil) {
    _paperRect.size.width = [ABI29_0_0RCTConvert CGFloat:options[@"width"]];
  }
  
  if (options[@"height"] != nil) {
    _paperRect.size.height = [ABI29_0_0RCTConvert CGFloat:options[@"height"]];
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
