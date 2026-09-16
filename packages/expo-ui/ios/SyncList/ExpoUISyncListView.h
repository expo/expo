// Copyright 2025-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A `UICollectionView` whose cells synchronously render and mount React rows. Intrinsic content
 sizes that arrive later, including SwiftUI measurements, trigger a subsequent layout correction.
 */
@interface ExpoUISyncListView : UIView

/// The app's `RCTSurfacePresenter`. Typed `id` because its interface is C++ and Swift cannot import it.
@property (nonatomic, weak, nullable) id surfacePresenter;

/// Which `SyncList`'s `renderItem` the rows come from.
@property (nonatomic, copy, nullable) NSString *listId;

@property (nonatomic) NSInteger itemCount;

/// The committed JS renderer version; changes refresh the visible rows.
@property (nonatomic) NSInteger renderVersion;

/// The height used for rows that have not been rendered yet.
@property (nonatomic) CGFloat estimatedItemSize;


@end

NS_ASSUME_NONNULL_END
