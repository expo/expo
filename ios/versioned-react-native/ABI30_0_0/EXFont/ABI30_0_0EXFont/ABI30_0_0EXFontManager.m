// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXFont/ABI30_0_0EXFontManager.h>

static NSMutableDictionary *ABI30_0_0EXFonts = nil;

@implementation ABI30_0_0EXFontManager

+ (void)load
{
  ABI30_0_0EXFonts = [NSMutableDictionary dictionary];
}

+ (ABI30_0_0EXFont *)getFontForName:(NSString *)name
{
  return ABI30_0_0EXFonts[name];
}

+ (void)setFont:(ABI30_0_0EXFont *)font forName:(NSString *)name
{
  ABI30_0_0EXFonts[name] = font;
}

@end
