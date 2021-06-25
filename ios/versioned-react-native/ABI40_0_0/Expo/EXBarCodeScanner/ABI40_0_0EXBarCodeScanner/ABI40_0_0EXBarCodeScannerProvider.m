// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXBarCodeScanner/ABI40_0_0EXBarCodeScannerProvider.h>
#import <ABI40_0_0EXBarCodeScanner/ABI40_0_0EXBarCodeScanner.h>

@implementation ABI40_0_0EXBarCodeScannerProvider

ABI40_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI40_0_0UMBarCodeScannerProviderInterface)];
}

- (id<ABI40_0_0UMBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI40_0_0EXBarCodeScanner new];
}

@end
