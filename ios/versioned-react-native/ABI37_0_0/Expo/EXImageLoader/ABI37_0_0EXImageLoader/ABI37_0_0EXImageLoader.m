// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXImageLoader/ABI37_0_0EXImageLoader.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageLoader.h>

@interface ABI37_0_0EXImageLoader ()

@property (weak, nonatomic) ABI37_0_0RCTBridge *bridge;

@end

@implementation ABI37_0_0EXImageLoader

ABI37_0_0UM_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"ABI37_0_0EXImageLoader";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI37_0_0UMImageLoaderInterface)];
}

- (void)setBridge:(ABI37_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI37_0_0UMImageLoaderCompletionBlock)completionHandler
{
  [[_bridge moduleForClass:[ABI37_0_0RCTImageLoader class]] loadImageWithURLRequest:[NSURLRequest requestWithURL:imageURL]
                                                                  callback:^(NSError *error, UIImage *loadedImage) {
                                                                    completionHandler(error, loadedImage);
                                                                  }];
}

@end
