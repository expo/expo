// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXFont/ABI33_0_0EXFontManager.h>

static NSMutableDictionary *ABI33_0_0EXFonts = nil;

@implementation ABI33_0_0EXFontManager

+ (void)load
{
  ABI33_0_0EXFonts = [NSMutableDictionary dictionary];
}

+ (ABI33_0_0EXFont *)getFontForName:(NSString *)name
{
  return ABI33_0_0EXFonts[name];
}

+ (void)setFont:(ABI33_0_0EXFont *)font forName:(NSString *)name
{
  ABI33_0_0EXFonts[name] = font;
}

@end
