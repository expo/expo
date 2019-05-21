// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI33_0_0EXFont/ABI33_0_0EXFont.h>

@interface ABI33_0_0EXFontManager : NSObject

+ (ABI33_0_0EXFont *)getFontForName:(NSString *)name;
+ (void)setFont:(ABI33_0_0EXFont *)font forName:(NSString *)name;

@end
