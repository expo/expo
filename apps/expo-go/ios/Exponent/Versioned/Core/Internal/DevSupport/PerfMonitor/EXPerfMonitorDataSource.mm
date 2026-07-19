// Copyright 2025-present 650 Industries. All rights reserved.
//
// This file copies the behaviour of React Native's `RCTPerfMonitor` module but strips out
// its UIKit overlay. We keep the sampling logic (FPS links, memory etc.) so Expo Go can
// present the data inside a custom SwiftUI view.

#import "EXPerfMonitorDataSource.h"

#import <UIKit/UIKit.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <ReactCommon/RCTHost.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfacePresenter.h>
#import <ReactCommon/RuntimeExecutor.h>
#import <QuartzCore/QuartzCore.h>
#import <mach/mach.h>
#include <jsi/instrumentation.h>
#include <jsi/jsi.h>
#include <chrono>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/utils/Telemetry.h>

#if RCT_DEV

static const NSUInteger EXPerfMonitorHistoryLength = 40;
static const NSTimeInterval EXPerfMonitorStatsUpdateInterval = 1.0;

static vm_size_t EXPerfMonitorResidentMemorySize(void)
{
  vm_size_t memoryUsageInByte = 0;
  task_vm_info_data_t vmInfo;
  mach_msg_type_number_t count = TASK_VM_INFO_COUNT;
  kern_return_t kernelReturn = task_info(mach_task_self(), TASK_VM_INFO, (task_info_t)&vmInfo, &count);
  if (kernelReturn == KERN_SUCCESS) {
    memoryUsageInByte = (vm_size_t)vmInfo.phys_footprint;
  }
  return memoryUsageInByte;
}

@interface EXPerfMonitorFPSCounter : NSObject

- (instancetype)initWithHistoryLength:(NSUInteger)historyLength;
- (nullable EXPerfMonitorFPSState *)recordTimestamp:(NSTimeInterval)timestamp;
- (void)reset;

@end

@implementation EXPerfMonitorFPSState

- (instancetype)initWithCurrentFPS:(NSUInteger)currentFPS
                            history:(NSArray<NSNumber *> *)history
{
  if ((self = [super init])) {
    _currentFPS = currentFPS;
    _history = [history copy];
  }
  return self;
}

@end

@implementation EXPerfMonitorStatsSnapshot

- (instancetype)initWithMemoryMB:(double)memoryMB
                          heapMB:(double)heapMB
                layoutDurationMS:(double)layoutDurationMS
{
  if ((self = [super init])) {
    _memoryMB = memoryMB;
    _heapMB = heapMB;
    _layoutDurationMS = layoutDurationMS;
  }
  return self;
}

@end

@implementation EXPerfMonitorFPSCounter {
  NSUInteger _historyLength;
  NSMutableArray<NSNumber *> *_history;
  NSTimeInterval _previousTimestamp;
  NSUInteger _frameCount;
  NSUInteger _currentFPS;
}

- (instancetype)initWithHistoryLength:(NSUInteger)historyLength
{
  if ((self = [super init])) {
    _historyLength = historyLength;
    _history = [NSMutableArray arrayWithCapacity:historyLength];
    _previousTimestamp = -1;
    _frameCount = 0;
    _currentFPS = 0;
  }
  return self;
}

- (void)reset
{
  @synchronized(self) {
    _history = [NSMutableArray arrayWithCapacity:_historyLength];
    _previousTimestamp = -1;
    _frameCount = 0;
    _currentFPS = 0;
  }
}

- (nullable EXPerfMonitorFPSState *)recordTimestamp:(NSTimeInterval)timestamp
{
  @synchronized(self) {
    _frameCount++;
    if (_previousTimestamp < 0) {
      _previousTimestamp = timestamp;
      return nil;
    }

    NSTimeInterval delta = timestamp - _previousTimestamp;
    if (delta < 1) {
      return nil;
    }

    NSUInteger fps = (NSUInteger)round((double)_frameCount / delta);
    _currentFPS = fps;

    if (_history.count >= _historyLength) {
      [_history removeObjectAtIndex:0];
    }
    [_history addObject:@(fps)];

    _previousTimestamp = timestamp;
    _frameCount = 0;

    return [[EXPerfMonitorFPSState alloc] initWithCurrentFPS:_currentFPS
                                                     history:_history];
  }
}

@end

@interface EXPerfMonitorDataSource () <RCTSurfacePresenterObserver>

@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, assign) BOOL monitoring;
@property (nonatomic, strong) CADisplayLink *uiDisplayLink;
@property (nonatomic, strong) CADisplayLink *jsDisplayLink;
@property (nonatomic, strong) EXPerfMonitorFPSCounter *uiFPSCounter;
@property (nonatomic, strong) EXPerfMonitorFPSCounter *jsFPSCounter;
@property (nonatomic, assign) double hermesHeapSizeInMB;
@property (nonatomic, assign) BOOL observingSurfacePresenter;

@end

@implementation EXPerfMonitorDataSource {
  facebook::react::RuntimeExecutor _runtimeExecutor;
  double _lastLayoutDurationMS;
}

@synthesize host = _host;

- (instancetype)initWithBridge:(RCTBridge *)bridge host:(RCTHost *)host
{
  if ((self = [super init])) {
    _bridge = bridge;
    _uiFPSCounter = [[EXPerfMonitorFPSCounter alloc] initWithHistoryLength:EXPerfMonitorHistoryLength];
    _jsFPSCounter = [[EXPerfMonitorFPSCounter alloc] initWithHistoryLength:EXPerfMonitorHistoryLength];
    _hermesHeapSizeInMB = 0;
    _lastLayoutDurationMS = 0;
    self.host = host;
  }
  return self;
}

- (void)setHost:(RCTHost *)host
{
  if (_host == host) {
    return;
  }
  if (_host && self.observingSurfacePresenter) {
    [_host.surfacePresenter removeObserver:self];
    self.observingSurfacePresenter = NO;
  }
  _host = host;
  _hermesHeapSizeInMB = 0;
  _runtimeExecutor = facebook::react::RuntimeExecutor();
  _lastLayoutDurationMS = 0;
  if (_monitoring) {
    [self attachSurfacePresenterObserverIfNeeded];
  }
}

- (void)startMonitoring
{
  if (self.monitoring || !_bridge) {
    return;
  }

  self.monitoring = YES;
  self.hermesHeapSizeInMB = 0;
  [self.uiFPSCounter reset];
  [self.jsFPSCounter reset];
  _lastLayoutDurationMS = 0;

  [self attachSurfacePresenterObserverIfNeeded];
  [self startDisplayLinks];
  [self captureHermesHeapInfo];

  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf updateStats];
  });
}

- (void)stopMonitoring
{
  if (!self.monitoring) {
    return;
  }

  self.monitoring = NO;

  [self stopDisplayLinks];
  [self detachSurfacePresenterObserverIfNeeded];
  self.hermesHeapSizeInMB = 0;
  _runtimeExecutor = facebook::react::RuntimeExecutor();
  _lastLayoutDurationMS = 0;
}

- (void)dealloc
{
  [self detachSurfacePresenterObserverIfNeeded];
  [self stopMonitoring];
}

#pragma mark - Display links

- (void)startDisplayLinks
{
  if (!self.uiDisplayLink) {
    self.uiDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(handleUIDisplayLink:)];
    [self.uiDisplayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }

  __weak __typeof(self) weakSelf = self;
  [_bridge dispatchBlock:^{
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf || strongSelf.jsDisplayLink) {
      return;
    }
    strongSelf.jsDisplayLink = [CADisplayLink displayLinkWithTarget:strongSelf selector:@selector(handleJSDisplayLink:)];
    [strongSelf.jsDisplayLink addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];
  } queue:RCTJSThread];
}

- (void)stopDisplayLinks
{
  [self.uiDisplayLink invalidate];
  self.uiDisplayLink = nil;

  [self.jsDisplayLink invalidate];
  self.jsDisplayLink = nil;
}

- (void)handleUIDisplayLink:(CADisplayLink *)displayLink
{
  [self handleDisplayLink:displayLink forTrack:EXPerfMonitorTrackUI];
}

- (void)handleJSDisplayLink:(CADisplayLink *)displayLink
{
  [self handleDisplayLink:displayLink forTrack:EXPerfMonitorTrackJS];
}

- (void)handleDisplayLink:(CADisplayLink *)displayLink forTrack:(EXPerfMonitorTrack)track
{
  EXPerfMonitorFPSCounter *counter = (track == EXPerfMonitorTrackUI) ? self.uiFPSCounter : self.jsFPSCounter;
  EXPerfMonitorFPSState *state = [counter recordTimestamp:displayLink.timestamp];
  if (!state || !self.delegate) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self.monitoring) {
      [self.delegate perfMonitorDidUpdateFPS:state track:track];
    }
  });
}

- (void)updateStats
{
  if (!self.monitoring || !self.bridge) {
    return;
  }

  double memoryMB = (double)EXPerfMonitorResidentMemorySize() / 1024.0 / 1024.0;
  [self captureHermesHeapInfo];
  double heapMB = self.hermesHeapSizeInMB;
  double layoutDurationMS = _lastLayoutDurationMS;

  EXPerfMonitorStatsSnapshot *snapshot =
      [[EXPerfMonitorStatsSnapshot alloc] initWithMemoryMB:memoryMB
                                                   heapMB:heapMB
                                         layoutDurationMS:layoutDurationMS];

  if (self.delegate) {
    [self.delegate perfMonitorDidUpdateStats:snapshot];
  }

  __weak __typeof(self) weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(EXPerfMonitorStatsUpdateInterval * NSEC_PER_SEC)),
                 dispatch_get_main_queue(), ^{
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf && strongSelf.monitoring) {
      [strongSelf updateStats];
    }
  });
}

- (void)attachSurfacePresenterObserverIfNeeded
{
  if (self.observingSurfacePresenter || !self.host) {
    return;
  }
  [self.host.surfacePresenter addObserver:self];
  self.observingSurfacePresenter = YES;
}

- (void)detachSurfacePresenterObserverIfNeeded
{
  if (self.observingSurfacePresenter && self.host) {
    [self.host.surfacePresenter removeObserver:self];
  }
  self.observingSurfacePresenter = NO;
}

- (void)updateLayoutDurationForRootTag:(NSInteger)rootTag
{
  _lastLayoutDurationMS = 0;

  RCTHost *host = self.host;
  if (!host || !host.surfacePresenter) {
    return;
  }

  RCTFabricSurface *surface = [host.surfacePresenter surfaceForRootTag:rootTag];
  if (!surface) {
    return;
  }

  const facebook::react::SurfaceHandler &surfaceHandler = [surface surfaceHandler];
  auto mountingCoordinator = surfaceHandler.getMountingCoordinator();
  if (!mountingCoordinator) {
    return;
  }

  auto revision = mountingCoordinator->getBaseRevision();
  const auto layoutStart = revision.telemetry.getLayoutStartTime();
  const auto layoutEnd = revision.telemetry.getLayoutEndTime();

  if (layoutStart != facebook::react::kTelemetryUndefinedTimePoint &&
      layoutEnd != facebook::react::kTelemetryUndefinedTimePoint &&
      layoutEnd >= layoutStart) {
    auto duration = layoutEnd - layoutStart;
    _lastLayoutDurationMS = std::chrono::duration<double, std::milli>(duration).count();
  }
}

- (void)didMountComponentsWithRootTag:(NSInteger)rootTag
{
  if (!self.monitoring) {
    return;
  }
  [self updateLayoutDurationForRootTag:rootTag];
}

- (void)captureHermesHeapInfo
{
  if (!_runtimeExecutor) {
    RCTHost *host = self.host;
    if (!host) {
      self.hermesHeapSizeInMB = 0;
      return;
    }
    _runtimeExecutor = host.surfacePresenter.runtimeExecutor;
  }

  if (!_runtimeExecutor) {
    self.hermesHeapSizeInMB = 0;
    return;
  }

  __weak __typeof(self) weakSelf = self;
  _runtimeExecutor([weakSelf](facebook::jsi::Runtime &runtime) {
    auto &instrumentation = runtime.instrumentation();
    auto heapInfo = instrumentation.getHeapInfo(true);
    auto iterator = heapInfo.find("hermes_allocatedBytes");
    double usedBytes = (iterator != heapInfo.end()) ? static_cast<double>(iterator->second) : 0;

    dispatch_async(dispatch_get_main_queue(), ^{
      __strong __typeof(weakSelf) strongSelf = weakSelf;
      if (!strongSelf || !strongSelf.monitoring) {
        return;
      }
      strongSelf.hermesHeapSizeInMB = usedBytes > 0 ? (usedBytes / 1024.0 / 1024.0) : 0;
    });
  });
}

@end

#endif
