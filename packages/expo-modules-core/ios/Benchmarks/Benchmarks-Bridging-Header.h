// Copyright 2026-present 650 Industries. All rights reserved.

// Exposes the Obj-C test doubles that the benchmarks share with the tests. A test spec target has no
// module for its own Obj-C sources, so they cross over through this bridging header (see
// `SWIFT_OBJC_BRIDGING_HEADER` in the podspec's `Benchmarks` test spec).

#import "../Tests/Mocks/EXTestNewComponentDescriptor.h"
