// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXFont/ABI39_0_0EXFontScaler.h>

#import <ABI39_0_0EXFont/ABI39_0_0EXFont.h>
#import <objc/runtime.h>

@implementation ABI39_0_0EXFontScaler

- (UIFont *)scaledFont:(UIFont *)font toSize:(CGFloat)fontSize
{
  ABI39_0_0EXFont *exFont = objc_getAssociatedObject(font, ABI39_0_0EXFontAssocKey);
  return [exFont UIFontWithSize:fontSize];
}

@end
