/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModulesConformingToProtocolsProvider.h"

@implementation RCTModulesConformingToProtocolsProvider

+(NSArray<NSString *> *)imageURLLoaderClassNames
{
  static NSArray<NSString *> *classNames = nil;
  static dispatch_once_t onceToken;
  
  dispatch_once(&onceToken, ^{
    classNames = @[
      
    ];
  });
  
  return classNames;
}

+(NSArray<NSString *> *)imageDataDecoderClassNames
{
  static NSArray<NSString *> *classNames = nil;
  static dispatch_once_t onceToken;
  
  dispatch_once(&onceToken, ^{
    classNames = @[
      
    ];
  });
  
  return classNames;
}

+(NSArray<NSString *> *)URLRequestHandlerClassNames
{
  static NSArray<NSString *> *classNames = nil;
  static dispatch_once_t onceToken;
  
  dispatch_once(&onceToken, ^{
    classNames = @[
      
    ];
  });
  
  return classNames;
}

@end
