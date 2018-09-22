// Copyright 2004-present Facebook. All Rights Reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <FBAudienceNetwork/FBAdDefines.h>
#import <FBAudienceNetwork/FBNativeAd.h>
#import <FBAudienceNetwork/FBNativeAdsManager.h>

NS_ASSUME_NONNULL_BEGIN

/**
  Additional functionality on top of FBNativeAdsManager to assist in using native ads within a UICollectionView. This class contains a mechanism to map indexPaths to native ads in a stable manner as well as helpers which assist in doing the math to include ads at a regular interval within a collection view.
 */
FB_CLASS_EXPORT
@interface FBNativeAdCollectionViewAdProvider : NSObject

/**
  Passes delegate methods from FBNativeAd. Separate delegate calls will be made for each native ad contained.
 */
@property (nonatomic, weak, nullable) id<FBNativeAdDelegate> delegate;

/**
  Create a FBNativeAdCollectionViewAdProvider.

 - Parameter manager: The FBNativeAdsManager which is consumed by this class.
 */
- (instancetype)initWithManager:(FBNativeAdsManager *)manager NS_DESIGNATED_INITIALIZER;

/**
  Retrieve a native ad for an indexPath, will return the same ad for a given indexPath until the native ads manager is refreshed. This method is intended for usage with a collection view and specifically the caller is recommended to wait until  collectionView:cellForRowAtIndexPath: to ensure getting the best native ad for the given collection cell.

 - Parameter collectionView: The collectionView where native ad will be used
 - Parameter indexPath: The indexPath to use as a key for this native ad
 - Returns: A FBNativeAd which is loaded and ready to be used.
 */
- (FBNativeAd *)collectionView:(UICollectionView *)collectionView nativeAdForRowAtIndexPath:(NSIndexPath *)indexPath;

/**
  Support for evenly distributed native ads within a collection view. Computes whether this cell is an ad or not.

 - Parameter indexPath: The indexPath of the cell within the collection view
 - Parameter stride: The frequency that native ads are to appear within the collection view
 - Returns: Boolean indicating whether the cell at the path is an ad
 */
- (BOOL)isAdCellAtIndexPath:(NSIndexPath *)indexPath forStride:(NSUInteger)stride;

/**
  Support for evenly distributed native ads within a collection view. Adjusts a non-ad cell indexPath to the indexPath it would be in a collection with no ads.

 - Parameter indexPath: The indexPath to of the non-ad cell
 - Parameter stride: The frequency that native ads are to appear within the collection view
 - Returns: An indexPath adjusted to what it would be in a collection view with no ads
 */
- (nullable NSIndexPath *)adjustNonAdCellIndexPath:(NSIndexPath *)indexPath forStride:(NSUInteger)stride;

/**
  Support for evenly distributed native ads within a collection view. Adjusts the total count of cells within the collection view to account for the ad cells.

 - Parameter count: The count of cells in the collection view not including ads
 - Parameter stride: The frequency that native ads are to appear within the collection view
 - Returns: The total count of cells within the collection view including both ad and non-ad cells
 */
- (NSUInteger)adjustCount:(NSUInteger)count forStride:(NSUInteger)stride;

@end

NS_ASSUME_NONNULL_END
