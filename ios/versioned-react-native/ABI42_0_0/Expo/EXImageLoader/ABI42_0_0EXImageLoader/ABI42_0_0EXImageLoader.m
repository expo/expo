// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXImageLoader/ABI42_0_0EXImageLoader.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageLoaderProtocol.h>

@interface ABI42_0_0EXImageLoader ()

@property (weak, nonatomic) ABI42_0_0RCTBridge *bridge;

@end

@implementation ABI42_0_0EXImageLoader

ABI42_0_0UM_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"ABI42_0_0EXImageLoader";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI42_0_0EXImageLoaderInterface)];
}

- (void)setBridge:(ABI42_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI42_0_0EXImageLoaderCompletionBlock)completionHandler
{
  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES] loadImageWithURLRequest:[NSURLRequest requestWithURL:imageURL]
                                                                  callback:^(NSError *error, UIImage *loadedImage) {
                                                                    completionHandler(error, loadedImage);
                                                                  }];
}

@end
