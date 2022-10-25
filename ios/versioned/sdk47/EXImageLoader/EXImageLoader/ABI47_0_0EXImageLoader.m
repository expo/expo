// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXImageLoader/ABI47_0_0EXImageLoader.h>
#import <ABI47_0_0React/ABI47_0_0RCTImageLoaderProtocol.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUtilities.h>

@interface ABI47_0_0EXImageLoader ()

@property (weak, nonatomic) ABI47_0_0RCTBridge *bridge;

@end

@implementation ABI47_0_0EXImageLoader

ABI47_0_0EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"ABI47_0_0EXImageLoader";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI47_0_0EXImageLoaderInterface)];
}

- (void)setBridge:(ABI47_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI47_0_0EXImageLoaderCompletionBlock)completionHandler
{
  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES] loadImageWithURLRequest:[NSURLRequest requestWithURL:imageURL]
                                                                  callback:^(NSError *error, UIImage *loadedImage) {
                                                                    completionHandler(error, loadedImage);
                                                                  }];
}

@end
