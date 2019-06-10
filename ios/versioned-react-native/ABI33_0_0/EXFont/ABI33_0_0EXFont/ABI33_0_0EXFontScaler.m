// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXFont/ABI33_0_0EXFontScaler.h>

#import <ABI33_0_0EXFont/ABI33_0_0EXFont.h>
#import <objc/runtime.h>

@implementation ABI33_0_0EXFontScaler

- (UIFont *)scaledFont:(UIFont *)font toSize:(CGFloat)fontSize
{
  ABI33_0_0EXFont *exFont = objc_getAssociatedObject(font, ABI33_0_0EXFontAssocKey);
  return [exFont UIFontWithSize:fontSize];
}

@end
