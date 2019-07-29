// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCellular/EXCellularModule.h>

#import <CoreTelephony/CTCarrier.h>
#import <CoreTelephony/CTTelephonyNetworkInfo.h>


@interface EXCellularModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXCellularModule

UM_EXPORT_MODULE(ExpoCellular);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

UM_EXPORT_METHOD_AS(getCellularGenerationAsync, getCellularGenerationAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve(@"generation here");
}

- (NSDictionary *)constantsToExport
{
  CTCarrier *carrier = [self carrier];
  
  return @{
           @"allowsVoip": @(carrier.allowsVOIP),
           @"carrier": carrier.carrierName,
           @"isoCountryCode": carrier.isoCountryCode,
           @"mobileCountryCode": carrier.mobileCountryCode,
           @"mobileNetworkCode": carrier.mobileNetworkCode,
           };
}

- (CTCarrier *)carrier
{
  CTTelephonyNetworkInfo *info = [[CTTelephonyNetworkInfo alloc] init];
  NSDictionary<NSString *, CTCarrier *> *serviceSubscriberCellularProviders;
  CTCarrier *carrier;
  
  if (@available(iOS 12.0, *)) {
    serviceSubscriberCellularProviders = info.serviceSubscriberCellularProviders;
    carrier = serviceSubscriberCellularProviders.allValues.firstObject;
  } else {
    // Fallback on earlier versions
    /*
     @property (nonatomic, readonly, retain, nullable) NSString *carrierName;
     @property (nonatomic, readonly, retain, nullable) NSString *mobileCountryCode;
     @property (nonatomic, readonly, retain, nullable) NSString *mobileNetworkCode;
     @property (nonatomic, readonly, retain, nullable) NSString* isoCountryCode;
     @property (nonatomic, readonly, assign) BOOL allowsVOIP;
     */
    carrier = info.subscriberCellularProvider;
  }
  
  return carrier;
}

@end
