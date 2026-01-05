// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class RCTBridge;
@class RCTHost;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSUInteger, EXPerfMonitorTrack) {
  EXPerfMonitorTrackUI,
  EXPerfMonitorTrackJS
};

// Captures FPS samples and other metrics emitted by the legacy React Native perf monitor.
// The implementation is based on `RCTPerfMonitor` from RN, but split out so the UI can be
// replaced with our SwiftUI overlay.
@interface EXPerfMonitorFPSState : NSObject

@property (nonatomic, readonly) NSUInteger currentFPS;
@property (nonatomic, strong, readonly) NSArray<NSNumber *> *history;

- (instancetype)initWithCurrentFPS:(NSUInteger)currentFPS
                            history:(NSArray<NSNumber *> *)history NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;

@end

@interface EXPerfMonitorStatsSnapshot : NSObject

@property (nonatomic, readonly) double memoryMB;
@property (nonatomic, readonly) double heapMB;
@property (nonatomic, readonly) double layoutDurationMS;

- (instancetype)initWithMemoryMB:(double)memoryMB
                          heapMB:(double)heapMB
                layoutDurationMS:(double)layoutDurationMS NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;

@end

@protocol EXPerfMonitorDataSourceDelegate <NSObject>

- (void)perfMonitorDidUpdateStats:(EXPerfMonitorStatsSnapshot *)stats;
- (void)perfMonitorDidUpdateFPS:(EXPerfMonitorFPSState *)fpsState track:(EXPerfMonitorTrack)track;

@end

@interface EXPerfMonitorDataSource : NSObject

@property (nonatomic, weak, nullable) id<EXPerfMonitorDataSourceDelegate> delegate;

- (instancetype)initWithBridge:(RCTBridge *)bridge host:(nullable RCTHost *)host;

@property (nonatomic, weak, nullable) RCTHost *host;

- (void)startMonitoring;
- (void)stopMonitoring;

@end

NS_ASSUME_NONNULL_END
