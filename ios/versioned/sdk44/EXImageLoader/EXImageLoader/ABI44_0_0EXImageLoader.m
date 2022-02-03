// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXImageLoader/ABI44_0_0EXImageLoader.h>
#import <ABI44_0_0React/ABI44_0_0RCTImageLoaderProtocol.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUtilities.h>

@interface ABI44_0_0EXImageLoader ()

@property (weak, nonatomic) ABI44_0_0RCTBridge *bridge;

@end

@implementation ABI44_0_0EXImageLoader

ABI44_0_0EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"ABI44_0_0EXImageLoader";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI44_0_0EXImageLoaderInterface)];
}

- (void)setBridge:(ABI44_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI44_0_0EXImageLoaderCompletionBlock)completionHandler
{
  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES] loadImageWithURLRequest:[NSURLRequest requestWithURL:imageURL]
                                                                  callback:^(NSError *error, UIImage *loadedImage) {
                                                                    completionHandler(error, loadedImage);
                                                                  }];
}

@end
