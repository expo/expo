// Copyright 2019-present 650 Industries. All rights reserved.

#ifndef EXScoper_h
#define EXScoper_h

@protocol EXScoper <NSObject>

- (NSString*)getScopedString:(NSString*)string;

- (NSString*)getUnscopedString:(NSString*)string;

@end

#endif /* EXScoper_h */
