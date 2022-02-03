// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXBarCodeScanner/ABI43_0_0EXBarCodeScannerProvider.h>
#import <ABI43_0_0EXBarCodeScanner/ABI43_0_0EXBarCodeScanner.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDefines.h>

@implementation ABI43_0_0EXBarCodeScannerProvider

ABI43_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI43_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI43_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI43_0_0EXBarCodeScanner new];
}

@end
