// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI44_0_0EXFont/ABI44_0_0EXFont.h>

@interface ABI44_0_0EXFontManager : NSObject

- (instancetype)init;
- (ABI44_0_0EXFont *)fontForName:(NSString *)name;
- (void)setFont:(ABI44_0_0EXFont *)font forName:(NSString *)name;

@end
