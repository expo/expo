// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXBarCodeScanner/ABI44_0_0EXBarCodeScannerProvider.h>
#import <ABI44_0_0EXBarCodeScanner/ABI44_0_0EXBarCodeScanner.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDefines.h>

@implementation ABI44_0_0EXBarCodeScannerProvider

ABI44_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI44_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI44_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI44_0_0EXBarCodeScanner new];
}

@end
