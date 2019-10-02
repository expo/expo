// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXBarCodeScanner/ABI34_0_0EXBarCodeScannerProvider.h>
#import <ABI34_0_0EXBarCodeScanner/ABI34_0_0EXBarCodeScanner.h>

@implementation ABI34_0_0EXBarCodeScannerProvider

ABI34_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI34_0_0UMBarCodeScannerProviderInterface)];
}

- (id<ABI34_0_0UMBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI34_0_0EXBarCodeScanner new];
}

@end
