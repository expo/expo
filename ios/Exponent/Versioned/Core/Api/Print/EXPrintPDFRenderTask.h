//
//  EXPrintPDFRenderTask.h
//  Exponent
//
//  Created by Tomasz Sapeta on 23/05/2018.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface EXPrintPDFRenderTask : NSObject

- (void)renderWithOptions:(nonnull NSDictionary *)options completionHandler:(void(^_Nullable)(NSData *_Nullable))handler;

@property (nonatomic, assign) int numberOfPages;
@property (nonatomic, assign) CGRect paperRect;

@end
