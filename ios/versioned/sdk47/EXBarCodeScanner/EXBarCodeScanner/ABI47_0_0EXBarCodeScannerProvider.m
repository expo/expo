// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXBarCodeScanner/ABI47_0_0EXBarCodeScannerProvider.h>
#import <ABI47_0_0EXBarCodeScanner/ABI47_0_0EXBarCodeScanner.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDefines.h>

@implementation ABI47_0_0EXBarCodeScannerProvider

ABI47_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI47_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI47_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI47_0_0EXBarCodeScanner new];
}

@end
