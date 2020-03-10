// Copyright 2020-present 650 Industries. All rights reserved.

#import <expo-image/EXImageViewManager.h>

@implementation EXImageViewManager

RCT_EXPORT_MODULE(ExpoImage)

- (UIView *)view
{
  // TODO: Implement some actually useful functionality
  UILabel * label = [[UILabel alloc] init];
  [label setTextColor:[UIColor redColor]];
  [label setText: @"*****"];
  [label sizeToFit];
  UIView * wrapper = [[UIView alloc] init];
  [wrapper addSubview:label];
  return wrapper;
}

@end
