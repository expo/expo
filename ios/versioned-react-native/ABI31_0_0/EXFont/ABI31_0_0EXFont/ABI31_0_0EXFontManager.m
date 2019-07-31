// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXFont/ABI31_0_0EXFontManager.h>

static NSMutableDictionary *ABI31_0_0EXFonts = nil;

@implementation ABI31_0_0EXFontManager

+ (void)load
{
  ABI31_0_0EXFonts = [NSMutableDictionary dictionary];
}

+ (ABI31_0_0EXFont *)getFontForName:(NSString *)name
{
  return ABI31_0_0EXFonts[name];
}

+ (void)setFont:(ABI31_0_0EXFont *)font forName:(NSString *)name
{
  ABI31_0_0EXFonts[name] = font;
}

@end
