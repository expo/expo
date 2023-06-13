// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

typedef void (^ABI47_0_0EXImageLoaderCompletionBlock)(NSError *error, UIImage *image);

@protocol ABI47_0_0EXImageLoaderInterface <NSObject>

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI47_0_0EXImageLoaderCompletionBlock)completionHandler;

@end
