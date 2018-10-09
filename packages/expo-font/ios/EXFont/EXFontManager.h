// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXFont/EXFont.h>

@interface EXFontManager : NSObject

+ (EXFont *)getFontForName:(NSString *)name;
+ (void)setFont:(EXFont *)font forName:(NSString *)name;

@end
