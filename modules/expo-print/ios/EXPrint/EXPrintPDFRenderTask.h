// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXPrintPDFRenderTask : NSObject

- (void)renderWithOptions:(nonnull NSDictionary *)options completionHandler:(void(^_Nullable)(NSData *_Nullable))handler;

@property (nonatomic, assign) int numberOfPages;
@property (nonatomic, assign) CGRect paperRect;

@end
