// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXFont/ABI36_0_0EXFontScaler.h>

#import <ABI36_0_0EXFont/ABI36_0_0EXFont.h>
#import <objc/runtime.h>

@implementation ABI36_0_0EXFontScaler

- (UIFont *)scaledFont:(UIFont *)font toSize:(CGFloat)fontSize
{
  ABI36_0_0EXFont *exFont = objc_getAssociatedObject(font, ABI36_0_0EXFontAssocKey);
  return [exFont UIFontWithSize:fontSize];
}

@end
