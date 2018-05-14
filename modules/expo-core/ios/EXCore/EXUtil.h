// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@interface EXUtil : NSObject

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;

@end
