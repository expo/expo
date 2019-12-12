// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

typedef void (^ABI36_0_0UMImageLoaderCompletionBlock)(NSError *error, UIImage *image);

@protocol ABI36_0_0UMImageLoaderInterface <NSObject>

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI36_0_0UMImageLoaderCompletionBlock)completionHandler;

@end
