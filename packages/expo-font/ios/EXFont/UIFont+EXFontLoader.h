// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

static const char *EXFontAssocKey = "EXFont";

@interface UIFont (EXFontLoader)

- (UIFont *)EXFontWithSize:(CGFloat)fontSize;

@end
