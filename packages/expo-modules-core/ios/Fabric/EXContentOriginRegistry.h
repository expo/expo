// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(ContentOriginRegistry)
@interface EXContentOriginRegistry : NSObject

/**
 Drops every published content origin
 */
+ (void)clearAll;

@end

NS_ASSUME_NONNULL_END
