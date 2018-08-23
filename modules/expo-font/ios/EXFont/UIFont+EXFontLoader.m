// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFont/UIFont+EXFontLoader.h>
#import <EXFont/EXFont.h>
#import <objc/runtime.h>

@implementation UIFont (EXFontLoader)

- (UIFont *)EXFontWithSize:(CGFloat)fontSize
{
  EXFont *exFont = objc_getAssociatedObject(self, EXFontAssocKey);
  if (exFont) {
    return [exFont UIFontWithSize:fontSize];
  } else {
    return [self EXFontWithSize:fontSize];
  }
}

@end
