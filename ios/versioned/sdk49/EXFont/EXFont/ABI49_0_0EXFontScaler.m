// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXFont/ABI49_0_0EXFontScaler.h>

#import <ABI49_0_0EXFont/ABI49_0_0EXFont.h>
#import <objc/runtime.h>

@implementation ABI49_0_0EXFontScaler

- (UIFont *)scaledFont:(UIFont *)font toSize:(CGFloat)fontSize
{
  ABI49_0_0EXFont *exFont = objc_getAssociatedObject(font, ABI49_0_0EXFontAssocKey);
  return [exFont UIFontWithSize:fontSize];
}

@end
