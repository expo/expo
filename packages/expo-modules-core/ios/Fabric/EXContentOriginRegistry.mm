// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXContentOriginRegistry.h>
#import <ExpoModulesCore/ContentOriginRegistry.h>

@implementation EXContentOriginRegistry

+ (void)clearAll
{
  expo::ContentOriginRegistry::clearAll();
}

@end
