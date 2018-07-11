// Copyright © 2015 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSingletonModule : NSObject

+ (nonnull instancetype)sharedInstance;
+ (NSString *)name;

@end

NS_ASSUME_NONNULL_END
