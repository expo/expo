// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXFont/ABI40_0_0EXFontScaler.h>

#import <ABI40_0_0EXFont/ABI40_0_0EXFont.h>
#import <objc/runtime.h>

@implementation ABI40_0_0EXFontScaler

- (UIFont *)scaledFont:(UIFont *)font toSize:(CGFloat)fontSize
{
  ABI40_0_0EXFont *exFont = objc_getAssociatedObject(font, ABI40_0_0EXFontAssocKey);
  return [exFont UIFontWithSize:fontSize];
}

@end
