// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMBarCodeScannerInterface/UMBarCodeScannerInterface.h>

@protocol UMBarCodeScannerProviderInterface

- (id<UMBarCodeScannerInterface>)createBarCodeScanner;

@end
