// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXBarCodeScanner/ABI45_0_0EXBarCodeScannerProvider.h>
#import <ABI45_0_0EXBarCodeScanner/ABI45_0_0EXBarCodeScanner.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXDefines.h>

@implementation ABI45_0_0EXBarCodeScannerProvider

ABI45_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI45_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI45_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI45_0_0EXBarCodeScanner new];
}

@end
