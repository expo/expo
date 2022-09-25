// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXImageLoader/ABI45_0_0EXImageLoader.h>
#import <ABI45_0_0React/ABI45_0_0RCTImageLoaderProtocol.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXUtilities.h>

@interface ABI45_0_0EXImageLoader ()

@property (weak, nonatomic) ABI45_0_0RCTBridge *bridge;

@end

@implementation ABI45_0_0EXImageLoader

ABI45_0_0EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"ABI45_0_0EXImageLoader";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI45_0_0EXImageLoaderInterface)];
}

- (void)setBridge:(ABI45_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI45_0_0EXImageLoaderCompletionBlock)completionHandler
{
  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES] loadImageWithURLRequest:[NSURLRequest requestWithURL:imageURL]
                                                                  callback:^(NSError *error, UIImage *loadedImage) {
                                                                    completionHandler(error, loadedImage);
                                                                  }];
}

@end
