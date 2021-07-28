// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCellular/EXCellularModule.h>

#import <CoreTelephony/CTCarrier.h>
#import <CoreTelephony/CTTelephonyNetworkInfo.h>


@interface EXCellularModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXCellularModule

EX_EXPORT_MODULE(ExpoCellular);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSDictionary *)constantsToExport
{
  CTCarrier *carrier = [self carrier];

  return [self getCurrentCellularInfo];
}

EX_EXPORT_METHOD_AS(getCellularGenerationAsync, getCellularGenerationAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  resolve(@([[self class] getCellularGeneration]));
}

EX_EXPORT_METHOD_AS(allowsVoipAsync, allowsVoipAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  resolve(@([self allowsVoip]));
}

EX_EXPORT_METHOD_AS(getIsoCountryCodeAsync, getIsoCountryCodeAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  resolve([self getIsoCountryCode]);
}

EX_EXPORT_METHOD_AS(getCarrierNameAsync, getCarrierNameAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  resolve([self getCarrierName]);
}

EX_EXPORT_METHOD_AS(getMobileCountryCodeAsync, getMobileCountryCodeAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  resolve([self getMobileCountryCode]);
}

EX_EXPORT_METHOD_AS(getMobileNetworkCodeAsync, getMobileNetworkCodeAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  resolve([self getMobileNetworkCode]);
}

+ (EXCellularGeneration)getCellularGeneration
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
      return EXCellularGeneration2G;
    } else if ([serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
      return EXCellularGeneration3G;
    } else if ([serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
      return EXCellularGeneration4G;
    } else if (@available(iOS 14.1, *) &&
               ([serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyNRNSA] ||
                [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyNR])) {
      return EXCellularGeneration5G;
    }
  }
  return EXCellularGenerationUnknown;
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
    @"carrier": EXNullIfNil(carrier.carrierName),
    @"isoCountryCode": EXNullIfNil(carrier.isoCountryCode),
    @"mobileCountryCode": EXNullIfNil(carrier.mobileCountryCode),
    @"mobileNetworkCode": EXNullIfNil(carrier.mobileNetworkCode),
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
