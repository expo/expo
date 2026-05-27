// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXSharedObjectUtils.h>
#import <ExpoModulesCore/SharedObject.h>

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
