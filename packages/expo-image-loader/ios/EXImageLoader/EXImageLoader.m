// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXImageLoader/EXImageLoader.h>
#import <React/RCTImageLoader.h>

@interface EXImageLoader ()

@property (weak, nonatomic) RCTBridge *bridge;

@end

@implementation EXImageLoader

UM_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"EXImageLoader";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMImageLoaderInterface)];
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(UMImageLoaderCompletionBlock)completionHandler
{
  [[_bridge moduleForClass:[RCTImageLoader class]] loadImageWithURLRequest:[NSURLRequest requestWithURL:imageURL]
                                                                  callback:^(NSError *error, UIImage *loadedImage) {
                                                                    completionHandler(error, loadedImage);
                                                                  }];
}

@end
