// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

typedef void (^UMImageLoaderCompletionBlock)(NSError *error, UIImage *image);

@protocol UMImageLoaderInterface <NSObject>

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(UMImageLoaderCompletionBlock)completionHandler;

@end
