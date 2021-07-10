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

  return @{
           @"allowsVoip": @(carrier.allowsVOIP),
           @"carrier": EXNullIfNil(carrier.carrierName),
           @"isoCountryCode": EXNullIfNil(carrier.isoCountryCode),
           @"mobileCountryCode": EXNullIfNil(carrier.mobileCountryCode),
           @"mobileNetworkCode": EXNullIfNil(carrier.mobileNetworkCode),
           };
}

EX_EXPORT_METHOD_AS(getCellularGenerationAsync, getCellularGenerationAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  resolve(@([[self class] getCellularGeneration]));
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

@end
