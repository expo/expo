// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXBarcodeScannerInterface.h>

@protocol EXBarCodeScannerProviderInterface

- (id<EXBarCodeScannerInterface>)createBarCodeScanner;

@end
