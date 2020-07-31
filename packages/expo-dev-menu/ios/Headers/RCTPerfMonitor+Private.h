// Copyright 2015-present 650 Industries. All rights reserved.

#if RCT_DEV

// This is needed because RCTPerfMonitor does not declare a public interface that we can import.
@interface RCTPerfMonitor <NSObject>

- (void)show;
- (void)hide;

@end

#endif
