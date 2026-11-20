// Copyright 2015-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <UIKit/UIKit.h>

#import <folly/dynamic.h>

namespace expo {

/**
 Serializes what is on screen in `rootView` into a template node
 `{ "name": "View", "props": {...}, "children": [...] }`. Returns null when the view is not visible.
 `budget` is the maximum number of views, and is decremented for each view that is visited.
 */
folly::dynamic serializeSplashScreenSnapshot(UIView *rootView, int &budget, bool debug);

} // namespace expo

#endif
