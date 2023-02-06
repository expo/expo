// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXBarCodeScanner/ABI48_0_0EXBarCodeScannerProvider.h>
#import <ABI48_0_0EXBarCodeScanner/ABI48_0_0EXBarCodeScanner.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXDefines.h>

@implementation ABI48_0_0EXBarCodeScannerProvider

ABI48_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI48_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI48_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI48_0_0EXBarCodeScanner new];
}

@end
