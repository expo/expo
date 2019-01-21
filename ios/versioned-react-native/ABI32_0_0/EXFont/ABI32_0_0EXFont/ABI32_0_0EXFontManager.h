// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXFont/ABI32_0_0EXFont.h>

@interface ABI32_0_0EXFontManager : NSObject

+ (ABI32_0_0EXFont *)getFontForName:(NSString *)name;
+ (void)setFont:(ABI32_0_0EXFont *)font forName:(NSString *)name;

@end
