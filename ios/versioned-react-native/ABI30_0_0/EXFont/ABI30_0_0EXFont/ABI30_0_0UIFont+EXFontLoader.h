// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

static const char *ABI30_0_0EXFontAssocKey = "ABI30_0_0EXFont";

@interface UIFont (ABI30_0_0EXFontLoader)

- (UIFont *)ABI30_0_0EXFontWithSize:(CGFloat)fontSize;

@end
