// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

typedef void (^ABI30_0_0EXImageLoaderCompletionBlock)(NSError *error, UIImage *image);

@protocol ABI30_0_0EXImageLoaderInterface <NSObject>

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI30_0_0EXImageLoaderCompletionBlock)completionHandler;

@end
