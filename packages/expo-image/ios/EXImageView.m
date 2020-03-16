// Copyright 2020-present 650 Industries. All rights reserved.

#import <expo-image/EXImageView.h>
#import <React/RCTConvert.h>

static NSString * const sourceUriKey = @"uri";

@implementation EXImageView

- (void)dealloc
{
  // Stop any active operations or downloads
  [self sd_setImageWithURL:nil];
}

# pragma mark -  Custom prop setters

- (void)setSource:(NSDictionary *)source
{
  NSURL *imageURL = [RCTConvert NSURL:source[sourceUriKey]];

  [self sd_setImageWithURL:imageURL];
}

@end
