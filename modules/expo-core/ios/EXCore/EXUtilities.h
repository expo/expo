// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@interface EXUtilities : NSObject

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (CGFloat)screenScale;

@end
