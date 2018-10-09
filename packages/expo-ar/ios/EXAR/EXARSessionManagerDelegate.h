// Copyright 2015-present 650 Industries. All rights reserved.

@protocol EXARSessionManagerDelegate <NSObject>

- (void)didUpdateWithEvent:(NSString *)name payload:(NSDictionary *)payload;

@end
