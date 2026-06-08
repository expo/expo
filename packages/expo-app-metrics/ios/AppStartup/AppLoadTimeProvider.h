// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_SWIFT_NAME(AppLoadTimeProvider)
@interface EXAppLoadTimeProvider : NSObject

+ (CFTimeInterval)getLoadTime;
+ (BOOL)wasPrewarmActive;

@end
