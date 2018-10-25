// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXFontInterface/EXFontScalerInterface.h>

@protocol EXFontScalersManagerInterface

- (void)registerFontScaler:(id<EXFontScalerInterface>)scaler;

@end
