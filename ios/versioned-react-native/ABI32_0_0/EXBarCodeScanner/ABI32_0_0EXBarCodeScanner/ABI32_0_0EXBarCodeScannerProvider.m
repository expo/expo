// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXBarCodeScanner/ABI32_0_0EXBarCodeScannerProvider.h>
#import <ABI32_0_0EXBarCodeScanner/ABI32_0_0EXBarCodeScanner.h>

@implementation ABI32_0_0EXBarCodeScannerProvider

ABI32_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI32_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI32_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI32_0_0EXBarCodeScanner new];
}

@end
