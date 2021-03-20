// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXBarCodeScanner/ABI41_0_0EXBarCodeScannerProvider.h>
#import <ABI41_0_0EXBarCodeScanner/ABI41_0_0EXBarCodeScanner.h>

@implementation ABI41_0_0EXBarCodeScannerProvider

ABI41_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI41_0_0UMBarCodeScannerProviderInterface)];
}

- (id<ABI41_0_0UMBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI41_0_0EXBarCodeScanner new];
}

@end
