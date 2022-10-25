// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

static const char *ABI47_0_0EXFontAssocKey = "ABI47_0_0EXFont";

@interface ABI47_0_0EXFont : NSObject

- (instancetype)initWithCGFont:(CGFontRef)cgFont;
- (UIFont *)UIFontWithSize:(CGFloat)fsize;

@end
