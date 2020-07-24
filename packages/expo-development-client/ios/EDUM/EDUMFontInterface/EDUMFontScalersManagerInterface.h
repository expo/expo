// Copyright 2018-present 650 Industries. All rights reserved.

#import <EDUMFontScalerInterface.h>

@protocol EDUMFontScalersManagerInterface

- (void)registerFontScaler:(id<EDUMFontScalerInterface>)scaler;

@end
