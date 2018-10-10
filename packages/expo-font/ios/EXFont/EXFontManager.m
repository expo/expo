// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFont/EXFontManager.h>

static NSMutableDictionary *EXFonts = nil;

@implementation EXFontManager

+ (void)load
{
  EXFonts = [NSMutableDictionary dictionary];
}

+ (EXFont *)getFontForName:(NSString *)name
{
  return EXFonts[name];
}

+ (void)setFont:(EXFont *)font forName:(NSString *)name
{
  EXFonts[name] = font;
}

@end
