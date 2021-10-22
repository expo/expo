// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXPrint/EXWKViewPrintPDFRenderer.h>
#import <ExpoModulesCore/EXDefines.h>

@interface EXWKViewPrintPDFRenderer ()

@property (nonatomic, assign) CGSize pageSize;
@property (nonatomic, assign) UIEdgeInsets pageMargins;

@end

@implementation EXWKViewPrintPDFRenderer

- (instancetype)initWithPageSize:(CGSize)pageSize pageMargins:(UIEdgeInsets)pageMargins
{
  if (self = [super init]) {
    _pageSize = pageSize;
    _pageMargins = pageMargins;
  }
  return self;
}

- (void)PDFFromWebView:(WKWebView *)webView completionHandler:(void (^)(NSError * _Nullable, NSData * _Nullable, int))handler
{
  EX_WEAKIFY(self);
  [webView evaluateJavaScript:@"document.body.scrollHeight;" completionHandler:^(id jsValue, NSError * _Nullable error) {
    EX_ENSURE_STRONGIFY(self);

    UIPrintPageRenderer *renderer = [[UIPrintPageRenderer alloc] init];
    [renderer addPrintFormatter:webView.viewPrintFormatter startingAtPageAtIndex:0];

    CGRect paperRect = CGRectMake(0, 0, self.pageSize.width, self.pageSize.height);
    [renderer setValue:[NSValue valueWithCGRect:paperRect] forKey:@"paperRect"];
    CGRect printableRect = CGRectMake(self.pageMargins.left, self.pageMargins.top, paperRect.size.width - self.pageMargins.left - self.pageMargins.right, paperRect.size.height - self.pageMargins.top - self.pageMargins.bottom);
    [renderer setValue:[NSValue valueWithCGRect:printableRect] forKey:@"printableRect"];

    NSMutableData* data = [[NSMutableData alloc] init];
    UIGraphicsBeginPDFContextToData(data, CGRectZero /* paperRect */, nil);
    [renderer prepareForDrawingPages: NSMakeRange(0, renderer.numberOfPages)];
    for (int i = 0; i < renderer.numberOfPages; i++) {
      UIGraphicsBeginPDFPage();
      [renderer drawPageAtIndex:i inRect: UIGraphicsGetPDFContextBounds()];
    }
    UIGraphicsEndPDFContext();

    handler(nil, data, (int)renderer.numberOfPages);
  }];
}

@end
