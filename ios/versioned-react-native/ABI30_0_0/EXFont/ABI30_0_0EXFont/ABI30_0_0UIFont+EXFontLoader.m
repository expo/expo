// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXFont/ABI30_0_0UIFont+EXFontLoader.h>
#import <ABI30_0_0EXFont/ABI30_0_0EXFont.h>
#import <objc/runtime.h>

@implementation UIFont (ABI30_0_0EXFontLoader)

- (UIFont *)ABI30_0_0EXFontWithSize:(CGFloat)fontSize
{
  ABI30_0_0EXFont *exFont = objc_getAssociatedObject(self, ABI30_0_0EXFontAssocKey);
  if (exFont) {
    return [exFont UIFontWithSize:fontSize];
  } else {
    return [self ABI30_0_0EXFontWithSize:fontSize];
  }
}

@end
