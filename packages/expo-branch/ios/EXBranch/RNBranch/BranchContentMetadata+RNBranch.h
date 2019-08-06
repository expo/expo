//
//  BranchContentMetadata+RNBranch.h
//  Branch-SDK
//
//  Created by Jimmy Dee on 12/6/17.
//

#import <Branch/Branch.h>

@interface BranchContentMetadata(RNBranch)

- (instancetype)initWithMap:(NSDictionary *)map;

- (void)setQuantityWithNumber:(NSNumber *)quantity;
- (void)setPriceWithString:(NSString *)price;
- (void)setRatingAverageWithNumber:(NSNumber *)ratingAverage;
- (void)setRatingCountWithNumber:(NSNumber *)ratingCount;
- (void)setRatingMaxWithNumber:(NSNumber *)ratingMax;
- (void)setLatitudeWithNumber:(NSNumber *)latitude;
- (void)setLongitudeWithNumber:(NSNumber *)longitude;
- (void)setImageCaptionsWithArray:(NSArray *)imageCaptions;
- (void)setCustomMetadataWithDictionary:(NSDictionary *)customMetadata;

@end
