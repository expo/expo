// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXCellular/ABI43_0_0EXCellularModule.h>

#import <CoreTelephony/CTCarrier.h>
#import <CoreTelephony/CTTelephonyNetworkInfo.h>


@interface ABI43_0_0EXCellularModule ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI43_0_0EXCellularModule

ABI43_0_0EX_EXPORT_MODULE(ExpoCellular);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSDictionary *)constantsToExport
{
  CTCarrier *carrier = [self carrier];

  return [self getCurrentCellularInfo];
}

ABI43_0_0EX_EXPORT_METHOD_AS(getCellularGenerationAsync, getCellularGenerationAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve(@([[self class] getCellularGeneration]));
}

ABI43_0_0EX_EXPORT_METHOD_AS(allowsVoipAsync, allowsVoipAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve(@([self allowsVoip]));
}

ABI43_0_0EX_EXPORT_METHOD_AS(getIsoCountryCodeAsync, getIsoCountryCodeAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve([self getIsoCountryCode]);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getCarrierNameAsync, getCarrierNameAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve([self getCarrierName]);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getMobileCountryCodeAsync, getMobileCountryCodeAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve([self getMobileCountryCode]);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getMobileNetworkCodeAsync, getMobileNetworkCodeAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve([self getMobileNetworkCode]);
}

+ (ABI43_0_0EXCellularGeneration)getCellularGeneration
{
  CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
  NSString *serviceCurrentRadioAccessTechnology;
  if (@available(iOS 12.0, *)) {
    serviceCurrentRadioAccessTechnology = netinfo.serviceCurrentRadioAccessTechnology.allValues.firstObject;
  } else {
    // Fallback on earlier versions
    serviceCurrentRadioAccessTechnology = netinfo.currentRadioAccessTechnology;
  }

  if (netinfo) {
    if ([serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyGPRS] ||
        [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyEdge] ||
        [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMA1x]) {
      return ABI43_0_0EXCellularGeneration2G;
    } else if ([serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
      return ABI43_0_0EXCellularGeneration3G;
    } else if ([serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
      return ABI43_0_0EXCellularGeneration4G;
    } else if (@available(iOS 14.1, *) &&
               ([serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyNRNSA] ||
                [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyNR])) {
      return ABI43_0_0EXCellularGeneration5G;
    }
  }
  return ABI43_0_0EXCellularGenerationUnknown;
}


- (CTCarrier *)carrier
{
  CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];

  if (@available(iOS 12.0, *)) {
    for (NSString *key in netinfo.serviceSubscriberCellularProviders) {
      CTCarrier *carrier = netinfo.serviceSubscriberCellularProviders[key];
      if (carrier.carrierName != nil) {
        return carrier;
      }
    }

    return [[netinfo.serviceSubscriberCellularProviders objectEnumerator] nextObject];
  }

  return netinfo.subscriberCellularProvider;
}

- (NSDictionary *)getCurrentCellularInfo
{
  CTCarrier *carrier = [self carrier];

  return @{
    @"allowsVoip": @(carrier.allowsVOIP),
    @"carrier": ABI43_0_0EXNullIfNil(carrier.carrierName),
    @"isoCountryCode": ABI43_0_0EXNullIfNil(carrier.isoCountryCode),
    @"mobileCountryCode": ABI43_0_0EXNullIfNil(carrier.mobileCountryCode),
    @"mobileNetworkCode": ABI43_0_0EXNullIfNil(carrier.mobileNetworkCode),
  };
}

- (BOOL)allowsVoip
{
  return [self carrier].allowsVOIP;
}

- (NSString *)getIsoCountryCode
{
  return [self carrier].isoCountryCode;
}

- (NSString *)getCarrierName
{
  return [self carrier].carrierName;
}

- (NSString *)getMobileCountryCode
{
  return [self carrier].mobileCountryCode;
}

- (NSString *)getMobileNetworkCode
{
  return [self carrier].mobileNetworkCode;
}

@end
