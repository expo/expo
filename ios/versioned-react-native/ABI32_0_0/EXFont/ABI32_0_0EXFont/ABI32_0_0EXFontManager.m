// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXFont/ABI32_0_0EXFontManager.h>

static NSMutableDictionary *ABI32_0_0EXFonts = nil;

@implementation ABI32_0_0EXFontManager

+ (void)load
{
  ABI32_0_0EXFonts = [NSMutableDictionary dictionary];
}

+ (ABI32_0_0EXFont *)getFontForName:(NSString *)name
{
  return ABI32_0_0EXFonts[name];
}

+ (void)setFont:(ABI32_0_0EXFont *)font forName:(NSString *)name
{
  ABI32_0_0EXFonts[name] = font;
}

@end
