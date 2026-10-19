// Copyright 2025-present 650 Industries. All rights reserved.

// Exposes the Obj-C test doubles from `Mocks/` to the Swift tests. A test spec target
// has no module for its own Obj-C sources, so they cross over through this bridging
// header (see `SWIFT_OBJC_BRIDGING_HEADER` in the podspec's test spec).

#import "Mocks/EXTestReactScheduler.h"
