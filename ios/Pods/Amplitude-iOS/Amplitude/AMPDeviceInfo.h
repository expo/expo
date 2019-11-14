//
//  AMPDeviceInfo.h

@interface AMPDeviceInfo : NSObject

-(id) init: (BOOL) disableIdfaTracking;
@property (readonly) NSString *appVersion;
@property (readonly) NSString *osName;
@property (readonly) NSString *osVersion;
@property (readonly) NSString *manufacturer;
@property (readonly) NSString *model;
@property (readonly) NSString *carrier;
@property (readonly) NSString *country;
@property (readonly) NSString *language;
@property (readonly) NSString *advertiserID;
@property (readonly) NSString *vendorID;

+(NSString*) generateUUID;

@end
