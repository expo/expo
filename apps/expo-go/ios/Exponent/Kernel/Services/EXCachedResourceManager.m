// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCachedResourceManager.h"

@implementation EXCachedResourceManager

- (EXCachedResource *)createCachedResourceWithName:(NSString *)resourceName
                                      resourceType:(NSString *)resourceType
                                         remoteUrl:(NSURL *)url
                                         cachePath:(NSString * _Nullable)cachePath
{
  return [[EXCachedResource alloc] initWithResourceName:resourceName
                                           resourceType:resourceType
                                              remoteUrl:url
                                              cachePath:cachePath];
}

@end
