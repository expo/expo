// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFont/EXFontManager.h>

@implementation EXFontManager

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMutableDictionary dictionary];
  }
  return self;
}

- (EXFont *)getFontForName:(NSString *)name
{
  return _registry[name];
}

- (void)setFont:(EXFont *)font forName:(NSString *)name
{
  _registry[name] = font;
}

@end
