// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMFontInterface/UMFontScalerInterface.h>

@protocol UMFontScalersManagerInterface

- (void)registerFontScaler:(id<UMFontScalerInterface>)scaler;

@end
