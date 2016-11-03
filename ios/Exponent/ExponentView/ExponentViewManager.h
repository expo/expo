// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXViewController;

@interface ExponentViewManager : NSObject

+ (instancetype)sharedInstance;

/**
 *  The root Exponent view controller hosting a detached Exponent app.
 */
- (EXViewController *)rootViewController;

@end
