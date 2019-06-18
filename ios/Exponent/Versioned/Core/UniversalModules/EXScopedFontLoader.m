// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXFont/EXFontLoader.h>)
#import "EXScopedFontLoader.h"
#import "EXConstantsBinding.h"
#import <UMConstantsInterface/UMConstantsInterface.h>

static NSString *expoPrefix = @"ExpoFont-";

@implementation EXScopedFontLoader

- (instancetype)init {
    return [super initWithFontFamilyPrefix:expoPrefix];
}

@end
#endif
