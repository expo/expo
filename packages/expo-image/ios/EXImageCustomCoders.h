// Copyright 2020-present 650 Industries. All rights reserved.

#import <SDWebImage/SDImageCodersManager.h>
#import <SDWebImageWebPCoder/SDWebImageWebPCoder.h>

@interface EXImageCustomCoders : NSObject

+ (void)registerCustomCoders;
+ (id<SDImageCoder>)SVGCoder;
+ (SDImageWebPCoder *)WebPCoder;

@end
