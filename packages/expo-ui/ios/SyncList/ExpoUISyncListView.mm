// Copyright 2025-present 650 Industries. All rights reserved.

#import "ExpoUISyncListView.h"

#import <React/RCTFabricSurface.h>
#import <React/RCTMountingManager.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfaceView.h>
#import <react/renderer/mounting/MountingCoordinator.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/scheduler/SurfaceHandler.h>
#import <react/utils/OnScopeExit.h>

#include <algorithm>
#include <cmath>
#include <vector>

using namespace facebook;
using namespace facebook::react;

// Adapted from RNTester's RNTSynchronousList: a Fabric root per reusable cell,
// rendered and mounted during a synchronous runtime handoff on the UI thread.
// Keep numeric geometry for all items, but create UIKit attributes only for the
// requested viewport. FlowLayout's self-sizing invalidations are expensive when
// the scrollbar jumps across thousands of estimated items.
@interface ExpoUISyncListLayout : UICollectionViewLayout
@property (nonatomic) CGFloat estimatedItemSize;
- (void)resetMeasurements;
- (BOOL)updateHeight:(CGFloat)height atIndex:(NSUInteger)index;
@end

@implementation ExpoUISyncListLayout {
  std::vector<CGFloat> _heights;
  std::vector<CGFloat> _offsets;
  std::vector<bool> _measured;
  NSUInteger _dirtyFrom;
  CGFloat _width;
}

- (void)resetMeasurements
{
  _heights.clear();
  _offsets.clear();
  _measured.clear();
  _dirtyFrom = 0;
  [self invalidateLayout];
}

- (void)prepareLayout
{
  [super prepareLayout];
  NSUInteger count = [self.collectionView numberOfItemsInSection:0];
  CGFloat width = self.collectionView.bounds.size.width;
  if (_width != width) {
    _width = width;
    _heights.assign(count, self.estimatedItemSize);
    _offsets.assign(count + 1, 0);
    _measured.assign(count, false);
    _dirtyFrom = 0;
  }
  if (_heights.size() != count || _offsets.empty()) {
    NSUInteger previousCount = _heights.size();
    _heights.resize(count, self.estimatedItemSize);
    _measured.resize(count, false);
    _offsets.resize(count + 1, 0);
    _dirtyFrom = MIN(_dirtyFrom, MIN(previousCount, count));
  }
  // A compact suffix sum is cheap for large lists. No React
  // work or per-item layout-attribute objects are needed for unseen messages.
  for (NSUInteger i = _dirtyFrom; i < count; i++) {
    _offsets[i + 1] = _offsets[i] + _heights[i];
  }
  _dirtyFrom = count;
}

- (void)setEstimatedItemSize:(CGFloat)estimatedItemSize
{
  if (_estimatedItemSize == estimatedItemSize) {
    return;
  }
  _estimatedItemSize = estimatedItemSize;
  for (NSUInteger i = 0; i < _heights.size(); i++) {
    if (!_measured[i]) {
      _heights[i] = estimatedItemSize;
      _dirtyFrom = MIN(_dirtyFrom, i);
    }
  }
  [self invalidateLayout];
}

- (CGSize)collectionViewContentSize
{
  return CGSizeMake(_width, _offsets.empty() ? 0 : _offsets.back());
}

- (BOOL)updateHeight:(CGFloat)height atIndex:(NSUInteger)index
{
  if (index >= _heights.size() || !std::isfinite(height) || height < 0) {
    return NO;
  }
  _measured[index] = true;
  if (fabs(_heights[index] - height) <= 0.01) {
    return NO;
  }
  _heights[index] = height;
  _dirtyFrom = MIN(_dirtyFrom, index);
  return YES;
}

- (UICollectionViewLayoutAttributes *)layoutAttributesForItemAtIndexPath:(NSIndexPath *)indexPath
{
  NSUInteger index = indexPath.item;
  if (index >= _heights.size()) {
    return nil;
  }
  UICollectionViewLayoutAttributes *attributes =
      [UICollectionViewLayoutAttributes layoutAttributesForCellWithIndexPath:indexPath];
  attributes.frame = CGRectMake(0, _offsets[index], _width, _heights[index]);
  return attributes;
}

- (NSArray<UICollectionViewLayoutAttributes *> *)layoutAttributesForElementsInRect:(CGRect)rect
{
  NSMutableArray<UICollectionViewLayoutAttributes *> *result = [NSMutableArray new];
  auto first = std::upper_bound(_offsets.begin(), _offsets.end(), CGRectGetMinY(rect));
  NSUInteger index = first == _offsets.begin() ? 0 : (first - _offsets.begin() - 1);
  for (; index < _heights.size() && _offsets[index] < CGRectGetMaxY(rect); index++) {
    [result addObject:[self layoutAttributesForItemAtIndexPath:[NSIndexPath indexPathForItem:index inSection:0]]];
  }
  return result;
}

- (BOOL)shouldInvalidateLayoutForBoundsChange:(CGRect)newBounds
{
  return newBounds.size.width != _width;
}

- (BOOL)shouldInvalidateLayoutForPreferredLayoutAttributes:(UICollectionViewLayoutAttributes *)preferred
                                  withOriginalAttributes:(UICollectionViewLayoutAttributes *)original
{
  [self updateHeight:preferred.size.height atIndex:preferred.indexPath.item];
  return fabs(preferred.size.height - original.size.height) > 0.01;
}

- (UICollectionViewLayoutInvalidationContext *)invalidationContextForPreferredLayoutAttributes:
                                                    (UICollectionViewLayoutAttributes *)preferred
                                                                       withOriginalAttributes:
                                                                           (UICollectionViewLayoutAttributes *)original
{
  [self updateHeight:preferred.size.height atIndex:preferred.indexPath.item];
  return [super invalidationContextForPreferredLayoutAttributes:preferred withOriginalAttributes:original];
}
@end

// Always called outside collection-view and parent Fabric mounting transactions.
static void ExpoUIStopSyncListSurfaces(NSArray<RCTFabricSurface *> *surfaces, RCTSurfacePresenter *presenter)
{
  if (surfaces.count == 0) {
    return;
  }
  if (presenter.scheduler) {
    auto scheduler = presenter.contextContainer->at<std::weak_ptr<RuntimeScheduler>>(RuntimeSchedulerKey).lock();
    if (scheduler) {
      scheduler->executeNowOnTheSameThread([&](jsi::Runtime &runtime) {
        // During host teardown the runtime may already have lost the JS hooks.
        auto value = runtime.global().getProperty(runtime, "__ExpoUISyncListUnmount");
        if (!value.isObject() || !value.asObject(runtime).isFunction(runtime)) {
          return;
        }
        auto unmount = value.asObject(runtime).asFunction(runtime);
        for (RCTFabricSurface *surface in surfaces) {
          if (surface.surfaceHandler.getStatus() == SurfaceHandler::Status::Running) {
            unmount.call(runtime, surface.surfaceHandler.getSurfaceId());
          }
        }
      });
    }
  }
  for (RCTFabricSurface *surface in surfaces) {
    [surface stop];
  }
}

@interface ExpoUISyncListCell : UICollectionViewCell
@property (nonatomic, strong) RCTFabricSurface *surface;
@property (nonatomic, strong) UIView *reactContainer;
@property (nonatomic, weak) RCTSurfacePresenter *presenter;
@property (nonatomic) CGSize measuredSize;
@end

@implementation ExpoUISyncListCell
- (void)dealloc
{
  RCTFabricSurface *surface = _surface;
  RCTSurfacePresenter *presenter = _presenter;
  if (surface) {
    // UIKit can retire pooled cells without notifying the list. Retain only
    // their roots until cleanup can safely run, never the deallocating cell.
    dispatch_async(dispatch_get_main_queue(), ^{
      ExpoUIStopSyncListSurfaces(@[surface], presenter);
    });
  }
}

- (UICollectionViewLayoutAttributes *)preferredLayoutAttributesFittingAttributes:(UICollectionViewLayoutAttributes *)attributes
{
  UICollectionViewLayoutAttributes *result = [attributes copy];
  result.size = self.measuredSize;
  return result;
}
@end

@interface ExpoUISyncListView () <UICollectionViewDataSource, RCTSurfacePresenterObserver>
@end

@implementation ExpoUISyncListView {
  UICollectionView *_collection;
  ExpoUISyncListLayout *_layout;
  NSHashTable<ExpoUISyncListCell *> *_cells;
  __weak RCTSurfacePresenter *_appliedPresenter;
  NSString *_appliedListId;
  NSInteger _appliedItemCount;
  NSInteger _appliedRenderVersion;
  BOOL _collectionUpdateScheduled;
  BOOL _renderingCell;
  BOOL _measurementUpdateScheduled;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _estimatedItemSize = 120;
    _cells = [NSHashTable weakObjectsHashTable];
    _layout = [ExpoUISyncListLayout new];
    _layout.estimatedItemSize = _estimatedItemSize;
    _collection = [[UICollectionView alloc] initWithFrame:CGRectZero collectionViewLayout:_layout];
    _collection.dataSource = self;
    _collection.prefetchingEnabled = NO;
    _collection.backgroundColor = UIColor.clearColor;
    [_collection registerClass:ExpoUISyncListCell.class forCellWithReuseIdentifier:@"cell"];
    [self addSubview:_collection];
  }
  return self;
}

- (void)dealloc
{
  [_appliedPresenter removeObserver:self];
}

- (void)setSurfacePresenter:(id)surfacePresenter
{
  if (_surfacePresenter == surfacePresenter) {
    return;
  }
  _surfacePresenter = surfacePresenter;
  [self scheduleCollectionUpdate];
}

- (void)setListId:(NSString *)listId
{
  if ([_listId isEqualToString:listId]) {
    return;
  }
  _listId = [listId copy];
  [self scheduleCollectionUpdate];
}

- (void)setItemCount:(NSInteger)itemCount
{
  itemCount = MAX(0, itemCount);
  if (_itemCount == itemCount) {
    return;
  }
  _itemCount = itemCount;
  [self scheduleCollectionUpdate];
}

- (void)setRenderVersion:(NSInteger)renderVersion
{
  if (_renderVersion == renderVersion) {
    return;
  }
  _renderVersion = renderVersion;
  [self scheduleCollectionUpdate];
}

- (void)setEstimatedItemSize:(CGFloat)estimatedItemSize
{
  estimatedItemSize = std::isfinite(estimatedItemSize) && estimatedItemSize > 0 ? estimatedItemSize : 120;
  if (_estimatedItemSize == estimatedItemSize) {
    return;
  }
  _estimatedItemSize = estimatedItemSize;
  [self scheduleCollectionUpdate];
}

- (void)scheduleCollectionUpdate
{
  if (_collectionUpdateScheduled) {
    return;
  }
  _collectionUpdateScheduled = YES;
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_collectionUpdateScheduled = NO;
    if (!self.window) {
      return; // Reattachment applies the latest props.
    }
    RCTSurfacePresenter *presenter = self.surfacePresenter;
    if (self->_appliedPresenter != presenter || ![self->_appliedListId isEqualToString:self.listId]) {
      [self stopCells];
    }
    if (self->_appliedPresenter != presenter) {
      [self->_appliedPresenter removeObserver:self];
      [presenter addObserver:self];
    }
    self->_appliedPresenter = presenter;
    self->_appliedListId = [self.listId copy];
    self->_appliedRenderVersion = self.renderVersion;
    // UIKit must see the count from this reload, never partially applied props.
    self->_appliedItemCount = presenter.scheduler && self->_appliedListId.length > 0 ? self.itemCount : 0;
    self->_layout.estimatedItemSize = self.estimatedItemSize;
    [self->_layout invalidateLayout];
    [self->_collection reloadData];
  });
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  BOOL widthChanged = _collection.bounds.size.width != self.bounds.size.width;
  _collection.frame = self.bounds;
  if (widthChanged) {
    [_layout invalidateLayout];
    [self scheduleCollectionUpdate];
  }
}

- (NSInteger)collectionView:(UICollectionView *)collectionView numberOfItemsInSection:(NSInteger)section
{
  return _appliedItemCount;
}

- (UICollectionViewCell *)collectionView:(UICollectionView *)collectionView
                 cellForItemAtIndexPath:(NSIndexPath *)indexPath
{
  NSAssert(NSThread.isMainThread, @"SyncList cells must render on the UI thread");
  NSAssert(!_renderingCell, @"Recursive SyncList cell rendering is unsupported");
  RCTSurfacePresenter *presenter = _appliedPresenter;
  NSAssert(presenter.scheduler != nil, @"SyncList requires a running surface presenter");
  _renderingCell = YES;
  OnScopeExit finish([&] { _renderingCell = NO; });

  ExpoUISyncListCell *cell = [collectionView dequeueReusableCellWithReuseIdentifier:@"cell" forIndexPath:indexPath];
  CGSize size = CGSizeMake(collectionView.bounds.size.width, CGFLOAT_MAX);
  auto scheduler = presenter.contextContainer->at<std::weak_ptr<RuntimeScheduler>>(RuntimeSchedulerKey).lock();
  NSAssert(scheduler, @"SyncList requires a runtime scheduler");
  bool committed = false;
  bool retired = false;
  scheduler->executeNowOnTheSameThread([&](jsi::Runtime &runtime) {
    if (!cell.surface) {
      cell.presenter = presenter;
      // An empty module name skips AppRegistry: our JS hook owns this root.
      cell.surface = [[RCTFabricSurface alloc] initWithSurfacePresenter:presenter
                                                           moduleName:@""
                                                    initialProperties:@{}];
      cell.reactContainer = cell.surface.view;
      [cell.contentView addSubview:cell.reactContainer];
      [cell.surface setMinimumSize:CGSizeMake(size.width, 0) maximumSize:size];
      [presenter.mountingManager attachSurfaceToView:cell.reactContainer
                                          surfaceId:cell.surface.surfaceHandler.getSurfaceId()];
      // Already holding the runtime on UI; RCTFabricSurface.start would hop
      // to a background queue and lose the synchronous mounting guarantee.
      cell.surface.surfaceHandler.start();
      [_cells addObject:cell];
    }
    [cell.surface setMinimumSize:CGSizeMake(size.width, 0) maximumSize:size];
    auto render = runtime.global().getPropertyAsFunction(runtime, "__ExpoUISyncListRender");
    auto result = render.call(runtime,
                            jsi::String::createFromUtf8(runtime, _appliedListId.UTF8String),
                            cell.surface.surfaceHandler.getSurfaceId(),
                            (double)indexPath.item,
                            (double)_appliedRenderVersion);
    retired = result.isNull();
    committed = !retired && result.getBool();
  });
  // The handoff also drains the event-loop tick and Fabric mounting. Measure
  // the mounted revision, without cloning the tree or committing a fixed height.
  // JS can retire a renderer before its native update/removal is mounted. UIKit still needs
  // a cell for its in-flight request; hide any recycled content until that update completes.
  cell.reactContainer.hidden = retired;
  if (retired) {
    CGFloat height = [_layout layoutAttributesForItemAtIndexPath:indexPath].size.height;
    cell.measuredSize = CGSizeMake(size.width, height);
    cell.reactContainer.frame = (CGRect){CGPointZero, cell.measuredSize};
    return cell;
  }
  if (!committed) {
    [NSException raise:NSInternalInconsistencyException
                format:@"SyncList row %ld did not commit synchronously", (long)indexPath.item];
  }
  auto revision = cell.surface.surfaceHandler.getMountingCoordinator()->getBaseRevision();
  auto mountedSize = revision.rootShadowNode->getLayoutMetrics().frame.size;
  NSAssert(std::isfinite(mountedSize.height) && mountedSize.height >= 0,
           @"SyncList rows must have a finite, nonnegative mounted height");
  cell.measuredSize = CGSizeMake(mountedSize.width, mountedSize.height);
  cell.reactContainer.frame = (CGRect){CGPointZero, cell.measuredSize};
  return cell;
}

- (void)didMountComponentsWithRootTag:(ReactTag)rootTag
{
  // SwiftUI Host(matchContents), image loading and local row state can change
  // the root's size after cellForItemAtIndexPath: has returned. A React commit
  // alone is too early: read the revision after Fabric has mounted it.
  if (_measurementUpdateScheduled || !self.window) {
    return;
  }
  for (ExpoUISyncListCell *cell in _cells.allObjects) {
    if (!cell.surface || cell.reactContainer.hidden || cell.surface.surfaceHandler.getSurfaceId() != rootTag) {
      continue;
    }
    auto coordinator = cell.surface.surfaceHandler.getMountingCoordinator();
    if (!coordinator) {
      return;
    }
    auto revision = coordinator->getBaseRevision();
    if (!revision.rootShadowNode) {
      return;
    }
    auto size = revision.rootShadowNode->getLayoutMetrics().frame.size;
    if (fabs(size.width - cell.measuredSize.width) > 0.01 || fabs(size.height - cell.measuredSize.height) > 0.01) {
      [self scheduleMeasurementUpdate];
    }
    return;
  }
}

- (void)scheduleMeasurementUpdate
{
  if (_measurementUpdateScheduled) {
    return;
  }
  _measurementUpdateScheduled = YES;
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_measurementUpdateScheduled = NO;
    if (!self.window || self->_appliedItemCount == 0) {
      return;
    }

    BOOL changed = NO;
    // Resolve the current cell/index/surface here, rather than capturing an
    // index in the mount callback: UIKit may have recycled the cell meanwhile.
    for (ExpoUISyncListCell *cell in self->_cells.allObjects) {
      NSIndexPath *indexPath = [self->_collection indexPathForCell:cell];
      if (!indexPath || !cell.surface || cell.reactContainer.hidden || cell.surface.surfaceHandler.getStatus() != SurfaceHandler::Status::Running) {
        continue;
      }
      auto coordinator = cell.surface.surfaceHandler.getMountingCoordinator();
      if (!coordinator) {
        continue;
      }
      auto revision = coordinator->getBaseRevision();
      if (!revision.rootShadowNode) {
        continue;
      }
      auto size = revision.rootShadowNode->getLayoutMetrics().frame.size;
      // A width change schedules a reload with fresh constraints. Do not apply
      // an old-width measurement to the new layout while that reload is pending.
      if (!std::isfinite(size.height) || size.height < 0 ||
          fabs(size.width - self->_collection.bounds.size.width) > 0.01) {
        continue;
      }
      cell.measuredSize = CGSizeMake(size.width, size.height);
      cell.reactContainer.frame = (CGRect){CGPointZero, cell.measuredSize};
      changed |= [self->_layout updateHeight:size.height atIndex:indexPath.item];
    }
    if (changed) {
      // Updating UIKit inside didMount could synchronously request another
      // React row inside an in-flight Fabric transaction. Run only after it ends.
      [self->_layout invalidateLayout];
      [self->_collection setNeedsLayout];
    }
  });
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (self.window) {
    [self scheduleCollectionUpdate];
  } else {
    // A temporary detach/reparent should not tear down the list's roots.
    dispatch_async(dispatch_get_main_queue(), ^{
      if (!self.window) {
        [self stopCells];
      }
    });
  }
}

- (void)stopCells
{
  NSMutableArray<RCTFabricSurface *> *surfaces = [NSMutableArray new];
  for (ExpoUISyncListCell *cell in _cells.allObjects) {
    if (cell.surface) {
      [surfaces addObject:cell.surface];
      cell.surface = nil; // Prevent the cell's dealloc from unmounting twice.
    }
    [cell.reactContainer removeFromSuperview];
    cell.reactContainer = nil;
  }
  ExpoUIStopSyncListSurfaces(surfaces, _appliedPresenter);
  [_cells removeAllObjects];
  _appliedItemCount = 0;
  [_layout resetMeasurements];
  [_collection reloadData];
}
@end
