// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXBarCodeScanner/ABI49_0_0EXBarCodeScannerProvider.h>
#import <ABI49_0_0EXBarCodeScanner/ABI49_0_0EXBarCodeScanner.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXDefines.h>

@implementation ABI49_0_0EXBarCodeScannerProvider

ABI49_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI49_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI49_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI49_0_0EXBarCodeScanner new];
}

@end
