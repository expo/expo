// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXImageLoader.h>
#import <React/RCTImageLoaderProtocol.h>
#import <React/RCTImageLoader.h>

@implementation EXImageLoader {
  RCTImageLoader *_rctImageLoader;
}

- (nonnull instancetype)initWithBridge:(nonnull RCTBridge *)bridge
{
  if (self = [super init]) {
    _rctImageLoader = [bridge moduleForName:@"RCTImageLoader" lazilyLoadIfNecessary:YES];
  }
  return self;
}

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(EXImageLoaderCompletionBlock)completionHandler
{
  [_rctImageLoader loadImageWithURLRequest:[NSURLRequest requestWithURL:imageURL] callback:completionHandler];
}

@end
