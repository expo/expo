// Copyright 2016-present 650 Industries. All rights reserved.

#import <EDEXBarCodeScannerProvider.h>
#import <EDEXBarCodeScanner.h>

@implementation EDEXBarCodeScannerProvider

EDUM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[];
//  return @[@protocol(EDUMBarCodeScannerProviderInterface)];
}

//- (id<EDUMBarCodeScannerInterface>)createBarCodeScanner
//{
//  return [EDEXBarCodeScanner new];
//}

@end
