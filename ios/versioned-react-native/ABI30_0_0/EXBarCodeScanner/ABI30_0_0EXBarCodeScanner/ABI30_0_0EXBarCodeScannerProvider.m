// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXBarCodeScanner/ABI30_0_0EXBarCodeScannerProvider.h>
#import <ABI30_0_0EXBarCodeScanner/ABI30_0_0EXBarCodeScanner.h>

@implementation ABI30_0_0EXBarCodeScannerProvider

ABI30_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI30_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI30_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI30_0_0EXBarCodeScanner new];
}

@end
