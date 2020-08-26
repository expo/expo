// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXFont/EXFontScalerInterface.h>

@protocol EXFontScalersManagerInterface

- (void)registerFontScaler:(id<EXFontScalerInterface>)scaler;

@end
