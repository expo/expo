//
//  BranchContentMetadata+RNBranch.m
//  Branch-SDK
//
//  Created by Jimmy Dee on 12/6/17.
//

#import "ABI29_0_0BranchContentMetadata+RNBranch.h"
#import "ABI29_0_0NSObject+RNBranch.h"
#import "ABI29_0_0RNBranchProperty.h"

@implementation BranchContentMetadata(ABI29_0_0RNBranch)

+ (NSDictionary<NSString *,ABI29_0_0RNBranchProperty *> *)supportedProperties
{
    static NSDictionary<NSString *, ABI29_0_0RNBranchProperty *> *_properties;
    static dispatch_once_t once = 0;
    dispatch_once(&once, ^{
        _properties =
        @{
          @"contentSchema": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setContentSchema:) type:NSString.class],
          @"quantity": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setQuantityWithNumber:) type:NSNumber.class],
          @"price": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setPriceWithString:) type:NSString.class],
          @"currency": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCurrency:) type:NSString.class],
          @"sku": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setSku:) type:NSString.class],
          @"productName": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setProductName:) type:NSString.class],
          @"productBrand": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setProductBrand:) type:NSString.class],
          @"productCategory": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setProductCategory:) type:NSString.class],
          @"productVariant": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setProductVariant:) type:NSString.class],
          @"condition": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCondition:) type:NSString.class],
          @"ratingAverage": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setRatingAverageWithNumber:) type:NSNumber.class],
          @"ratingCount": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setRatingCountWithNumber:) type:NSNumber.class],
          @"ratingMax": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setRatingMaxWithNumber:) type:NSNumber.class],
          @"addressStreet": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setAddressStreet:) type:NSString.class],
          @"addressCity": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setAddressCity:) type:NSString.class],
          @"addressRegion": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setAddressRegion:) type:NSString.class],
          @"addressCountry": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setAddressCountry:) type:NSString.class],
          @"addressPostalCode": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setAddressPostalCode:) type:NSString.class],
          @"latitude": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setLatitudeWithNumber:) type:NSNumber.class],
          @"longitude": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setLongitudeWithNumber:) type:NSNumber.class],
          @"imageCaptions": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setImageCaptionsWithArray:) type:NSArray.class],
          @"customMetadata": [ABI29_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCustomMetadataWithDictionary:) type:NSDictionary.class]
          };
    });
    
    return _properties;
}

- (instancetype)initWithMap:(NSDictionary *)map
{
    self = [self init];
    if (self) {
        [self setSupportedPropertiesWithMap:map];
    }
    return self;
}

- (void)setQuantityWithNumber:(NSNumber *)quantity
{
    self.quantity = quantity.doubleValue;
}

- (void)setPriceWithString:(NSString *)price
{
    self.price = [NSDecimalNumber decimalNumberWithString:price];
}

- (void)setRatingAverageWithNumber:(NSNumber *)ratingAverage
{
    self.ratingAverage = ratingAverage.doubleValue;
}

- (void)setRatingCountWithNumber:(NSNumber *)ratingCount
{
    self.ratingCount = ratingCount.integerValue;
}

- (void)setRatingMaxWithNumber:(NSNumber *)ratingMax
{
    self.ratingMax = ratingMax.doubleValue;
}

- (void)setLatitudeWithNumber:(NSNumber *)latitude
{
    self.latitude = latitude.doubleValue;
}

- (void)setLongitudeWithNumber:(NSNumber *)longitude
{
    self.longitude = longitude.doubleValue;
}

- (void)setImageCaptionsWithArray:(NSArray *)imageCaptions
{
    self.imageCaptions = imageCaptions.mutableCopy;
}

- (void)setCustomMetadataWithDictionary:(NSDictionary *)customMetadata
{
    self.customMetadata = customMetadata.mutableCopy;
}

@end
