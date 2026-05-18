// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXWorkletIntegration : NSObject
+ (void)register;
@end

@interface EXWorkletIntegrationLoader : NSObject
@end

@implementation EXWorkletIntegrationLoader

+ (void)load {
  [EXWorkletIntegration register];
}

@end
