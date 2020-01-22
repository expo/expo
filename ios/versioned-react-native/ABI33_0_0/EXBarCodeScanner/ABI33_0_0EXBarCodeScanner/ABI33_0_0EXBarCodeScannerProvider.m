// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXBarCodeScanner/ABI33_0_0EXBarCodeScannerProvider.h>
#import <ABI33_0_0EXBarCodeScanner/ABI33_0_0EXBarCodeScanner.h>

@implementation ABI33_0_0EXBarCodeScannerProvider

ABI33_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI33_0_0UMBarCodeScannerProviderInterface)];
}

- (id<ABI33_0_0UMBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI33_0_0EXBarCodeScanner new];
}

@end
