// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

@protocol EXFontScalerInterface

- (UIFont *)scaledFont:(UIFont *)font toSize:(CGFloat)fontSize;

@end
