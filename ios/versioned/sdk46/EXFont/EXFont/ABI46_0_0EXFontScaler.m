// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXFont/ABI46_0_0EXFontScaler.h>

#import <ABI46_0_0EXFont/ABI46_0_0EXFont.h>
#import <objc/runtime.h>

@implementation ABI46_0_0EXFontScaler

- (UIFont *)scaledFont:(UIFont *)font toSize:(CGFloat)fontSize
{
  ABI46_0_0EXFont *exFont = objc_getAssociatedObject(font, ABI46_0_0EXFontAssocKey);
  return [exFont UIFontWithSize:fontSize];
}

@end
