// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXFont/ABI30_0_0EXFont.h>

@interface ABI30_0_0EXFontManager : NSObject

+ (ABI30_0_0EXFont *)getFontForName:(NSString *)name;
+ (void)setFont:(ABI30_0_0EXFont *)font forName:(NSString *)name;

@end
