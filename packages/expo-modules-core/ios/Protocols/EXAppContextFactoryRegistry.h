// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXAppContextProtocol.h"

NS_ASSUME_NONNULL_BEGIN

/**
 Registry for the AppContext factory.
 ObjC code can use this to create AppContext instances by looking up
 the Swift factory class at runtime.
 */
@interface EXAppContextFactoryRegistry : NSObject

/**
 Creates a new AppContext instance using the Swift factory.
 This looks up the EXAppContextFactory class at runtime and calls its createAppContext method.
 @return A new AppContext instance, or nil if the factory class is not found.
 */
+ (nullable id<EXAppContextProtocol>)createAppContext;

@end

NS_ASSUME_NONNULL_END
