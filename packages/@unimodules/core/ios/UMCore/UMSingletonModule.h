// Copyright © 2015 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface UMSingletonModule : NSObject

+ (const NSString *)name;

- (const NSInteger)priority;

@end

NS_ASSUME_NONNULL_END
