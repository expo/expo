// Copyright © 2015 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXSingletonInterface <NSObject>

+ (nonnull instancetype)sharedInstance;

@end

@interface EXSingletonModule : NSObject

+ (const NSString *)name;

@end

NS_ASSUME_NONNULL_END
