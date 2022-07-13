// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXFont/ABI45_0_0EXFontScaler.h>

#import <ABI45_0_0EXFont/ABI45_0_0EXFont.h>
#import <objc/runtime.h>

@implementation ABI45_0_0EXFontScaler

- (UIFont *)scaledFont:(UIFont *)font toSize:(CGFloat)fontSize
{
  ABI45_0_0EXFont *exFont = objc_getAssociatedObject(font, ABI45_0_0EXFontAssocKey);
  return [exFont UIFontWithSize:fontSize];
}

@end
