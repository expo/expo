// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXImageLoader/EXImageLoader.h>
#import <React/RCTImageLoaderProtocol.h>
#import <ExpoModulesCore/EXUtilities.h>

@interface EXImageLoader ()

@property (weak, nonatomic) RCTBridge *bridge;

@end

@implementation EXImageLoader

EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"EXImageLoader";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXImageLoaderInterface)];
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(EXImageLoaderCompletionBlock)completionHandler
{
  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES] loadImageWithURLRequest:[NSURLRequest requestWithURL:imageURL]
                                                                  callback:^(NSError *error, UIImage *loadedImage) {
                                                                    completionHandler(error, loadedImage);
                                                                  }];
}

@end
