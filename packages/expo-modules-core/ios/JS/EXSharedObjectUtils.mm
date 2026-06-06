// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXSharedObjectUtils.h>
#import <ExpoModulesCore/SharedObject.h>

// Apple builds must see `<ExpoModulesJSI/NativeState.h>` so `expo::NativeState`
// is the base of `expo::SharedObject::NativeState`. Without it, `EventEmitter.h`
// falls back to `facebook::jsi::NativeState` directly and silently drops the
// context/deallocator passed below — the retained Swift `JavaScriptNativeState`
// would leak and JS-side `getNativeState` recovery would never return its
// wrapper. The `__has_include` probe lives in `EventEmitter.h`; this assertion
// turns a misconfigured app build into a compile error instead.
#if !__has_include(<ExpoModulesJSI/NativeState.h>)
#error \
  "ExpoModulesJSI public headers are not visible to this translation unit. " \
  "Verify that the ExpoModulesJSI xcframework is linked and its `Headers/` " \
  "are on the framework search path."
#endif

@implementation EXSharedObjectUtils

+ (void *)makeSharedObjectNativeStatePtr:(long)objectId
                                releaser:(ObjectReleaser)releaser
                                 context:(void *)context
                      contextDeallocator:(void (*)(void *))contextDeallocator
{
  // Heap-allocate the `shared_ptr<jsi::NativeState>` itself (not its pointee) so the
  // raw pointer crosses the no-interop boundary into Swift, where `JavaScriptNativeState`
  // adopts it: copies the shared_ptr into Swift-managed storage, then `delete`s this
  // allocation. The shared control block created by `make_shared` is unaffected.
  return new std::shared_ptr<jsi::NativeState>(
    std::make_shared<expo::SharedObject::NativeState>(
      objectId,
      [releaser](long id) { releaser(id); },
      context,
      contextDeallocator
    )
  );
}

@end
