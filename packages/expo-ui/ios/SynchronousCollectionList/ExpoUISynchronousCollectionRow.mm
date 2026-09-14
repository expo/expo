// Copyright 2026-present 650 Industries. All rights reserved.
#import "ExpoUISynchronousCollectionRow.h"

#import <React/RCTFabricSurface.h>
#import <React/RCTMountingManager.h>
#import <React/RCTScheduler.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfaceView.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/mounting/MountingCoordinator.h>
#import <react/utils/OnScopeExit.h>

#include <algorithm>
#include <vector>

using namespace facebook;
using namespace facebook::react;

// RNTester's synchronous collection example uses compact geometry instead of
// repeatedly asking a compositional layout to resolve thousands of estimates.
@implementation ExpoUISynchronousCollectionLayout {
  std::vector<CGFloat> _heights;
  std::vector<CGFloat> _offsets;
  NSUInteger _dirtyFrom;
  CGFloat _width;
  BOOL _resetMeasurements;
}

- (void)resetMeasurements
{
  _resetMeasurements = YES;
  [self invalidateLayout];
}

- (void)prepareLayout
{
  [super prepareLayout];
  UICollectionView *collection = self.collectionView;
  NSUInteger count = collection.numberOfSections ? [collection numberOfItemsInSection:0] : 0;
  CGFloat width = collection.bounds.size.width;
  if (_resetMeasurements || _heights.size() != count || _width != width) {
    _resetMeasurements = NO;
    _width = width;
    _heights.assign(count, 120);
    _offsets.assign(count + 1, 0);
    _dirtyFrom = 0;
  }
  // Only recompute the changed suffix, without allocating attributes or
  // rendering any of the intervening React rows.
  for (NSUInteger index = _dirtyFrom; index < count; index++) {
    _offsets[index + 1] = _offsets[index] + _heights[index];
  }
  _dirtyFrom = count;
}

- (CGSize)collectionViewContentSize
{
  return CGSizeMake(_width, _offsets.empty() ? 0 : _offsets.back());
}

- (UICollectionViewLayoutAttributes *)layoutAttributesForItemAtIndexPath:(NSIndexPath *)indexPath
{
  NSUInteger index = indexPath.item;
  if (indexPath.section != 0 || index >= _heights.size()) { return nil; }
  UICollectionViewLayoutAttributes *attributes =
      [UICollectionViewLayoutAttributes layoutAttributesForCellWithIndexPath:indexPath];
  attributes.frame = CGRectMake(0, _offsets[index], _width, _heights[index]);
  return attributes;
}

- (NSArray<UICollectionViewLayoutAttributes *> *)layoutAttributesForElementsInRect:(CGRect)rect
{
  NSMutableArray<UICollectionViewLayoutAttributes *> *attributes = [NSMutableArray new];
  auto first = std::upper_bound(_offsets.begin(), _offsets.end(), CGRectGetMinY(rect));
  NSUInteger index = first == _offsets.begin() ? 0 : first - _offsets.begin() - 1;
  for (; index < _heights.size() && _offsets[index] < CGRectGetMaxY(rect); index++) {
    [attributes addObject:[self layoutAttributesForItemAtIndexPath:[NSIndexPath indexPathForItem:index inSection:0]]];
  }
  return attributes;
}

- (BOOL)shouldInvalidateLayoutForBoundsChange:(CGRect)newBounds
{
  return newBounds.size.width != _width;
}

- (BOOL)shouldInvalidateLayoutForPreferredLayoutAttributes:(UICollectionViewLayoutAttributes *)preferred
                                  withOriginalAttributes:(UICollectionViewLayoutAttributes *)original
{
  return isfinite(preferred.size.height) && preferred.size.height > 0 &&
      fabs(preferred.size.height - original.size.height) > 0.01;
}

- (UICollectionViewLayoutInvalidationContext *)invalidationContextForPreferredLayoutAttributes:
                                                    (UICollectionViewLayoutAttributes *)preferred
                                                                       withOriginalAttributes:
                                                                           (UICollectionViewLayoutAttributes *)original
{
  UICollectionViewLayoutInvalidationContext *context =
      [super invalidationContextForPreferredLayoutAttributes:preferred withOriginalAttributes:original];
  NSUInteger index = preferred.indexPath.item;
  if (preferred.indexPath.section == 0 && index < _heights.size() &&
      isfinite(preferred.size.height) && preferred.size.height > 0) {
    CGFloat delta = preferred.size.height - _heights[index];
    _heights[index] = preferred.size.height;
    _dirtyFrom = MIN(_dirtyFrom, index);
    // Keep visible content anchored when an item entirely above it changes size.
    if (CGRectGetMaxY(original.frame) <= CGRectGetMinY(self.collectionView.bounds)) {
      CGPoint adjustment = context.contentOffsetAdjustment;
      adjustment.y += delta;
      context.contentOffsetAdjustment = adjustment;
    }
  }
  return context;
}
@end

// Spare roots retained in addition to roots currently leased by rows.
static const NSUInteger kMaxIdleSynchronousRoots = 16;

// Never stop/unmount a surface inside cell teardown or a parent Fabric mount.
static void RetireSurface(RCTFabricSurface *surface, RCTSurfacePresenter *presenter)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (presenter.scheduler && surface.surfaceHandler.getStatus() == SurfaceHandler::Status::Running) {
      auto scheduler = presenter.contextContainer->at<std::weak_ptr<RuntimeScheduler>>(RuntimeSchedulerKey).lock();
      if (scheduler) {
        scheduler->executeNowOnTheSameThread([&](jsi::Runtime &runtime) {
          auto unmount = runtime.global().getProperty(runtime, "__ExpoUIUnmountSyncCollectionRow");
          if (unmount.isObject() && unmount.asObject(runtime).isFunction(runtime)) {
            unmount.asObject(runtime).asFunction(runtime).call(runtime, surface.surfaceHandler.getSurfaceId());
          }
        });
      }
    }
    [surface stop];
  });
}

@interface ExpoUISynchronousCollectionRow ()
- (void)didMountComponentsWithRootTag:(ReactTag)rootTag;
@end

@interface ExpoUISynchronousCollectionRootPool () <RCTSurfacePresenterObserver>
@property (nonatomic, strong) RCTSurfacePresenter *presenter;
@property (nonatomic, strong) NSMutableArray<RCTFabricSurface *> *idle;
@property (nonatomic, strong) NSMapTable<NSNumber *, ExpoUISynchronousCollectionRow *> *owners;
@property (nonatomic, weak) RCTFabricSurface *renderingSurface;
@property (nonatomic) NSUInteger mountingDepth;
@property (nonatomic) BOOL rendering;
- (RCTFabricSurface *)acquire;
- (void)recycle:(RCTFabricSurface *)surface;
#if DEBUG
@property (nonatomic, strong) NSHashTable<RCTFabricSurface *> *surfaces;
@property (nonatomic) NSUInteger created;
@property (nonatomic) NSUInteger reused;
@property (nonatomic) NSUInteger measuredRequests;
@property (nonatomic) NSUInteger cachedRequests;
@property (nonatomic) double totalWaitMs;
@property (nonatomic) double totalWorkMs;
@property (nonatomic) double maxRequestMs;
@property (nonatomic) BOOL reportScheduled;
- (void)recordRenderDuration:(double)duration wait:(double)wait;
#endif
@end

@implementation ExpoUISynchronousCollectionRootPool
- (instancetype)initWithPresenter:(NSObject *)presenter
{
  if ((self = [super init])) {
    _presenter = (RCTSurfacePresenter *)presenter;
    _idle = [NSMutableArray new];
#if DEBUG
    _surfaces = [NSHashTable weakObjectsHashTable];
#endif
    _owners = [NSMapTable strongToWeakObjectsMapTable];
    [_presenter addObserver:self];
  }
  return self;
}

- (RCTFabricSurface *)acquire
{
  while (_idle.count) {
    RCTFabricSurface *surface = _idle.lastObject;
    [_idle removeLastObject];
    if (surface.surfaceHandler.getStatus() == SurfaceHandler::Status::Running) {
#if DEBUG
      _reused++;
#endif
      return surface;
    }
    RetireSurface(surface, _presenter);
  }
#if DEBUG
  _created++;
#endif
  RCTFabricSurface *surface = [[RCTFabricSurface alloc] initWithSurfacePresenter:_presenter moduleName:@"" initialProperties:@{}];
#if DEBUG
  [_surfaces addObject:surface];
#endif
  return surface;
}

- (void)recycle:(RCTFabricSurface *)surface
{
  [_owners removeObjectForKey:@(surface.surfaceHandler.getSurfaceId())];
  [surface.view removeFromSuperview];
  // Idle roots retain their React tree. Rebinding updates existing components;
  // row implementations own item-specific state resets.
  if (_idle.count < kMaxIdleSynchronousRoots && surface.surfaceHandler.getStatus() == SurfaceHandler::Status::Running) {
    [_idle addObject:surface];
  } else {
    RetireSurface(surface, _presenter);
  }
}

- (void)willMountComponentsWithRootTag:(ReactTag)rootTag { _mountingDepth++; }
- (void)didMountComponentsWithRootTag:(ReactTag)rootTag
{
  if (_mountingDepth) { _mountingDepth--; }
  // The synchronous request reads its own mounted size before returning. Route
  // other updates directly to their owner, not every retained cell.
  if (_renderingSurface && _renderingSurface.surfaceHandler.getSurfaceId() == rootTag) { return; }
  [[_owners objectForKey:@(rootTag)] didMountComponentsWithRootTag:rootTag];
}

#if DEBUG
- (void)recordRenderDuration:(double)duration wait:(double)wait
{
  _measuredRequests++;
  _totalWaitMs += wait;
  _totalWorkMs += duration - wait;
  _maxRequestMs = MAX(_maxRequestMs, duration);
  if (_reportScheduled) { return; }
  _reportScheduled = YES;
  __weak ExpoUISynchronousCollectionRootPool *weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC), dispatch_get_main_queue(), ^{
    ExpoUISynchronousCollectionRootPool *pool = weakSelf;
    if (!pool) { return; }
    NSLog(@"[UICollectionSyncList] requests=%lu cached=%lu avgWait=%.2fms avgWork=%.2fms max=%.2fms created=%lu reused=%lu live=%lu idle=%lu",
          (unsigned long)pool.measuredRequests, (unsigned long)pool.cachedRequests,
          pool.totalWaitMs / MAX(1, pool.measuredRequests), pool.totalWorkMs / MAX(1, pool.measuredRequests),
          pool.maxRequestMs, (unsigned long)pool.created, (unsigned long)pool.reused,
          (unsigned long)pool.surfaces.allObjects.count, (unsigned long)pool.idle.count);
    pool.measuredRequests = pool.cachedRequests = 0;
    pool.totalWaitMs = pool.totalWorkMs = pool.maxRequestMs = 0;
    pool.reportScheduled = NO;
  });
}
#endif

- (void)dealloc
{
  [_presenter removeObserver:self];
  for (RCTFabricSurface *surface in _idle) {
    RetireSurface(surface, _presenter);
  }
}
@end

@implementation ExpoUISynchronousCollectionRow {
  ExpoUISynchronousCollectionRootPool *_pool;
  RCTFabricSurface *_surface;
  NSString *_renderer;
  NSInteger _index;
  NSInteger _revision;
  BOOL _dirty;
  CGFloat _renderedWidth;
  CGSize _measured;
}

- (instancetype)initWithPool:(ExpoUISynchronousCollectionRootPool *)pool
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _pool = pool;
  }
  return self;
}

- (void)configureWithRenderer:(NSString *)renderer index:(NSInteger)index revision:(NSInteger)revision
{
  if (![_renderer isEqualToString:renderer] || _index != index || _revision != revision) {
    _renderer = [renderer copy];
    _index = index;
    _revision = revision;
    _dirty = YES;
    [self invalidateIntrinsicContentSize];
    [self setNeedsLayout];
  }
}

- (CGSize)renderWithWidth:(CGFloat)width
{
  NSAssert(NSThread.isMainThread, @"Synchronous rows must render on UI");
  if (!isfinite(width) || width <= 0) {
    return CGSizeZero; // An unspecified collection width must not create a root.
  }
  // Layout attributes and UIKit bounds can differ by subpixel rounding.
  CGFloat scale = self.traitCollection.displayScale;
  if (scale > 0) { width = round(width * scale) / scale; }
  if (_surface && !_dirty && _renderedWidth == width) {
#if DEBUG
    _pool.cachedRequests++;
#endif
    return _measured;
  }
  // A nested mount cannot finish synchronously: the outer transaction owns the
  // mounting manager. Fail explicitly instead of claiming an empty row is ready.
  if (_pool.rendering || _pool.mountingDepth || !_pool.presenter.scheduler) {
    [NSException raise:NSInternalInconsistencyException format:@"Synchronous row requested during Fabric mounting, reentrancy, or shutdown"];
  }
  auto scheduler = _pool.presenter.contextContainer->at<std::weak_ptr<RuntimeScheduler>>(RuntimeSchedulerKey).lock();
  if (!scheduler) {
    [NSException raise:NSInternalInconsistencyException format:@"Synchronous rows require a running runtime scheduler"];
  }
  _pool.rendering = YES;
  OnScopeExit finish([&] { _pool.renderingSurface = nil; _pool.rendering = NO; });
#if DEBUG
  CFTimeInterval requested = CACurrentMediaTime();
  double waitMs = 0;
#endif
  bool committed = false;
  scheduler->executeNowOnTheSameThread([&](jsi::Runtime &runtime) {
#if DEBUG
    waitMs = (CACurrentMediaTime() - requested) * 1000;
#endif
    if (!_surface) {
      _surface = [_pool acquire];
      [_pool.owners setObject:self forKey:@(_surface.surfaceHandler.getSurfaceId())];
      [self addSubview:_surface.view];
    }
    _pool.renderingSurface = _surface;
    [_surface setMinimumSize:CGSizeMake(width, 0) maximumSize:CGSizeMake(width, CGFLOAT_MAX)];
    if (_surface.surfaceHandler.getStatus() == SurfaceHandler::Status::Registered) {
      [_pool.presenter.mountingManager attachSurfaceToView:_surface.view surfaceId:_surface.surfaceHandler.getSurfaceId()];
      _surface.surfaceHandler.start();
    }
    auto render = runtime.global().getPropertyAsFunction(runtime, "__ExpoUIRenderSyncCollectionRow");
    committed = render.call(runtime, jsi::String::createFromUtf8(runtime, _renderer.UTF8String),
                            _surface.surfaceHandler.getSurfaceId(), (double)_index).getBool();
  });
  if (!committed) {
    [NSException raise:NSInternalInconsistencyException format:@"React row did not commit synchronously; suspension is unsupported"];
  }
  auto revision = _surface.surfaceHandler.getMountingCoordinator()->getBaseRevision();
  auto size = revision.rootShadowNode->getLayoutMetrics().frame.size;
  if (!isfinite(size.height) || size.height <= 0 || fabs(size.width - width) > 1) {
    [NSException raise:NSInternalInconsistencyException format:@"React row was not mounted with a finite positive height before sizing returned"];
  }
  _measured = CGSizeMake(size.width, size.height);
  _surface.view.frame = (CGRect){CGPointZero, _measured};
  _renderedWidth = width;
  _dirty = NO;
#if DEBUG
  [_pool recordRenderDuration:(CACurrentMediaTime() - requested) * 1000 wait:waitMs];
#endif
  return _measured;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (self.window && self.bounds.size.width > 0) {
    [self renderWithWidth:self.bounds.size.width];
  }
}

- (CGSize)intrinsicContentSize
{
  return _surface ? _measured : CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);
}

- (void)didMountComponentsWithRootTag:(ReactTag)rootTag
{
  if (!_surface || _surface.surfaceHandler.getSurfaceId() != rootTag) {
    return;
  }
  // Later React state changes may alter height. Notify UIKit after mounting,
  // without recursively rendering or changing layout in the mount callback.
  __weak ExpoUISynchronousCollectionRow *weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    ExpoUISynchronousCollectionRow *row = weakSelf;
    if (!row || !row->_surface || row->_surface.surfaceHandler.getSurfaceId() != rootTag) { return; }
    auto revision = row->_surface.surfaceHandler.getMountingCoordinator()->getBaseRevision();
    auto size = revision.rootShadowNode->getLayoutMetrics().frame.size;
    CGSize measured = CGSizeMake(size.width, size.height);
    if (isfinite(size.height) && size.height > 0 && !CGSizeEqualToSize(measured, row->_measured)) {
      row->_measured = measured;
      row->_surface.view.frame = (CGRect){CGPointZero, measured};
      [row invalidateIntrinsicContentSize];
      [row setNeedsLayout];
    }
  });
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (!self.window) {
    // UICollectionView may retain an offscreen cell. Release its lease before
    // prepareForReuse runs. Avoid releasing during transient reparenting.
    __weak ExpoUISynchronousCollectionRow *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      ExpoUISynchronousCollectionRow *row = weakSelf;
      if (row && !row.window) { [row releaseRoot]; }
    });
  } else {
    [self invalidateIntrinsicContentSize];
    [self setNeedsLayout];
  }
}

- (void)releaseRoot
{
  if (_surface) {
    [_pool recycle:_surface];
    _surface = nil;
    _dirty = YES;
  }
}

- (void)dealloc
{
  if (_surface) {
    [_pool.owners removeObjectForKey:@(_surface.surfaceHandler.getSurfaceId())];
    // UIKit can destroy a row before prepareForReuse releases its lease.
    // Capture the pool and surface, never the deallocating UIView. Returning the
    // root on the next main turn avoids tearing down/recreating it while scrolling.
    ExpoUISynchronousCollectionRootPool *pool = _pool;
    RCTFabricSurface *surface = _surface;
    dispatch_async(dispatch_get_main_queue(), ^{ [pool recycle:surface]; });
  }
}
@end
