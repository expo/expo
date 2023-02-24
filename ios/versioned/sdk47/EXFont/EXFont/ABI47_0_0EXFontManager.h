// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0EXFont/ABI47_0_0EXFont.h>

@interface ABI47_0_0EXFontManager : NSObject

- (instancetype)init;
- (ABI47_0_0EXFont *)fontForName:(NSString *)name;
- (void)setFont:(ABI47_0_0EXFont *)font forName:(NSString *)name;

@end
