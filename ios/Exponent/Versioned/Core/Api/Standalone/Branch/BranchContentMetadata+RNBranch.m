//
//  BranchContentMetadata+RNBranch.m
//  Branch-SDK
//
//  Created by Jimmy Dee on 12/6/17.
//

#import "BranchContentMetadata+RNBranch.h"
#import "NSObject+RNBranch.h"
#import "RNBranchProperty.h"

@implementation BranchContentMetadata(RNBranch)

+ (NSDictionary<NSString *,RNBranchProperty *> *)supportedProperties
{
    static NSDictionary<NSString *, RNBranchProperty *> *_properties;
    static dispatch_once_t once = 0;
    dispatch_once(&once, ^{
        _properties =
        @{
          @"contentSchema": [RNBranchProperty propertyWithSetterSelector:@selector(setContentSchema:) type:NSString.class],
          @"quantity": [RNBranchProperty propertyWithSetterSelector:@selector(setQuantityWithNumber:) type:NSNumber.class],
          @"price": [RNBranchProperty propertyWithSetterSelector:@selector(setPriceWithString:) type:NSString.class],
          @"currency": [RNBranchProperty propertyWithSetterSelector:@selector(setCurrency:) type:NSString.class],
          @"sku": [RNBranchProperty propertyWithSetterSelector:@selector(setSku:) type:NSString.class],
          @"productName": [RNBranchProperty propertyWithSetterSelector:@selector(setProductName:) type:NSString.class],
          @"productBrand": [RNBranchProperty propertyWithSetterSelector:@selector(setProductBrand:) type:NSString.class],
          @"productCategory": [RNBranchProperty propertyWithSetterSelector:@selector(setProductCategory:) type:NSString.class],
          @"productVariant": [RNBranchProperty propertyWithSetterSelector:@selector(setProductVariant:) type:NSString.class],
          @"condition": [RNBranchProperty propertyWithSetterSelector:@selector(setCondition:) type:NSString.class],
          @"ratingAverage": [RNBranchProperty propertyWithSetterSelector:@selector(setRatingAverageWithNumber:) type:NSNumber.class],
          @"ratingCount": [RNBranchProperty propertyWithSetterSelector:@selector(setRatingCountWithNumber:) type:NSNumber.class],
          @"ratingMax": [RNBranchProperty propertyWithSetterSelector:@selector(setRatingMaxWithNumber:) type:NSNumber.class],
          @"addressStreet": [RNBranchProperty propertyWithSetterSelector:@selector(setAddressStreet:) type:NSString.class],
          @"addressCity": [RNBranchProperty propertyWithSetterSelector:@selector(setAddressCity:) type:NSString.class],
          @"addressRegion": [RNBranchProperty propertyWithSetterSelector:@selector(setAddressRegion:) type:NSString.class],
          @"addressCountry": [RNBranchProperty propertyWithSetterSelector:@selector(setAddressCountry:) type:NSString.class],
          @"addressPostalCode": [RNBranchProperty propertyWithSetterSelector:@selector(setAddressPostalCode:) type:NSString.class],
          @"latitude": [RNBranchProperty propertyWithSetterSelector:@selector(setLatitudeWithNumber:) type:NSNumber.class],
          @"longitude": [RNBranchProperty propertyWithSetterSelector:@selector(setLongitudeWithNumber:) type:NSNumber.class],
          @"imageCaptions": [RNBranchProperty propertyWithSetterSelector:@selector(setImageCaptionsWithArray:) type:NSArray.class],
          @"customMetadata": [RNBranchProperty propertyWithSetterSelector:@selector(setCustomMetadataWithDictionary:) type:NSDictionary.class]
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
