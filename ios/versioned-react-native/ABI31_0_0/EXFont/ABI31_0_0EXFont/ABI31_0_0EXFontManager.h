// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI31_0_0EXFont/ABI31_0_0EXFont.h>

@interface ABI31_0_0EXFontManager : NSObject

+ (ABI31_0_0EXFont *)getFontForName:(NSString *)name;
+ (void)setFont:(ABI31_0_0EXFont *)font forName:(NSString *)name;

@end
