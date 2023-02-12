// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI48_0_0EXFont/ABI48_0_0EXFont.h>

@interface ABI48_0_0EXFontManager : NSObject

- (instancetype)init;
- (ABI48_0_0EXFont *)fontForName:(NSString *)name;
- (void)setFont:(ABI48_0_0EXFont *)font forName:(NSString *)name;

@end
