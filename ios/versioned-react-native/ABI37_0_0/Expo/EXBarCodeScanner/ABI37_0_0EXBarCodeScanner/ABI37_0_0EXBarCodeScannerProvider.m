// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXBarCodeScanner/ABI37_0_0EXBarCodeScannerProvider.h>
#import <ABI37_0_0EXBarCodeScanner/ABI37_0_0EXBarCodeScanner.h>

@implementation ABI37_0_0EXBarCodeScannerProvider

ABI37_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI37_0_0UMBarCodeScannerProviderInterface)];
}

- (id<ABI37_0_0UMBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI37_0_0EXBarCodeScanner new];
}

@end
