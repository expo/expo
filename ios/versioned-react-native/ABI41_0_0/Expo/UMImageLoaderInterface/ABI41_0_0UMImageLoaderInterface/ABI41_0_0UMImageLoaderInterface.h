// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

typedef void (^ABI41_0_0UMImageLoaderCompletionBlock)(NSError *error, UIImage *image);

@protocol ABI41_0_0UMImageLoaderInterface <NSObject>

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI41_0_0UMImageLoaderCompletionBlock)completionHandler;

@end
