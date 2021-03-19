// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXFont/ABI41_0_0EXFontScaler.h>

#import <ABI41_0_0EXFont/ABI41_0_0EXFont.h>
#import <objc/runtime.h>

@implementation ABI41_0_0EXFontScaler

- (UIFont *)scaledFont:(UIFont *)font toSize:(CGFloat)fontSize
{
  ABI41_0_0EXFont *exFont = objc_getAssociatedObject(font, ABI41_0_0EXFontAssocKey);
  return [exFont UIFontWithSize:fontSize];
}

@end
