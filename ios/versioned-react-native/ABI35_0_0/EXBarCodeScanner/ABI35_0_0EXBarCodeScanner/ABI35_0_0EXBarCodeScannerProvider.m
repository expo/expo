// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXBarCodeScanner/ABI35_0_0EXBarCodeScannerProvider.h>
#import <ABI35_0_0EXBarCodeScanner/ABI35_0_0EXBarCodeScanner.h>

@implementation ABI35_0_0EXBarCodeScannerProvider

ABI35_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI35_0_0UMBarCodeScannerProviderInterface)];
}

- (id<ABI35_0_0UMBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI35_0_0EXBarCodeScanner new];
}

@end
