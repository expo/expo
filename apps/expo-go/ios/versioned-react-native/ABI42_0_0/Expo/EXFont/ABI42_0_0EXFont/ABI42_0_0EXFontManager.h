// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0EXFont/ABI42_0_0EXFont.h>

@interface ABI42_0_0EXFontManager : NSObject

- (instancetype)init;
- (ABI42_0_0EXFont *)fontForName:(NSString *)name;
- (void)setFont:(ABI42_0_0EXFont *)font forName:(NSString *)name;

@end
