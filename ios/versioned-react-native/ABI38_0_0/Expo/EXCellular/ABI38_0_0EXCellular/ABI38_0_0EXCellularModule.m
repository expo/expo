// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXCellular/ABI38_0_0EXCellularModule.h>

#import <CoreTelephony/CTCarrier.h>
#import <CoreTelephony/CTTelephonyNetworkInfo.h>


@interface ABI38_0_0EXCellularModule ()

@property (nonatomic, weak) ABI38_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI38_0_0EXCellularModule

ABI38_0_0UM_EXPORT_MODULE(ExpoCellular);

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSDictionary *)constantsToExport
{
  CTCarrier *carrier = [self carrier];
  
  return @{
           @"allowsVoip": @(carrier.allowsVOIP),
           @"carrier": ABI38_0_0UMNullIfNil(carrier.carrierName),
           @"isoCountryCode": ABI38_0_0UMNullIfNil(carrier.isoCountryCode),
           @"mobileCountryCode": ABI38_0_0UMNullIfNil(carrier.mobileCountryCode),
           @"mobileNetworkCode": ABI38_0_0UMNullIfNil(carrier.mobileNetworkCode),
           };
}

ABI38_0_0UM_EXPORT_METHOD_AS(getCellularGenerationAsync, getCellularGenerationAsyncWithResolver:(ABI38_0_0UMPromiseResolveBlock)resolve rejecter:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  resolve(@([[self class] getCellularGeneration]));
}

+ (ABI38_0_0EXCellularGeneration)getCellularGeneration
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
      return ABI38_0_0EXCellularGeneration2G;
    } else if ([serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
               [serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
      return ABI38_0_0EXCellularGeneration3G;
    } else if ([serviceCurrentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
      return ABI38_0_0EXCellularGeneration4G;
    }
  }
  return ABI38_0_0EXCellularGenerationUnknown;
}


- (CTCarrier *)carrier
{
  CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
  NSDictionary<NSString *, CTCarrier *> *serviceSubscriberCellularProviders;
  CTCarrier *carrier;
  
  if (@available(iOS 12.0, *)) {
    serviceSubscriberCellularProviders = netinfo.serviceSubscriberCellularProviders;
    carrier = serviceSubscriberCellularProviders.allValues.firstObject;
  } else {
    carrier = netinfo.subscriberCellularProvider;
  }
  
  return carrier;
}

@end
