/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrDeferredDisplayList_DEFINED
#define GrDeferredDisplayList_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkTypes.h"
#include "include/gpu/GrRecordingContext.h"
#include "include/private/base/SkTArray.h"
#include "include/private/chromium/GrSurfaceCharacterization.h"

class GrDirectContext;
class GrRenderTargetProxy;
class GrRenderTask;
class GrDeferredDisplayListPriv;
class SkSurface;

/*
 * This class contains pre-processed gpu operations that can be replayed into
 * an SkSurface via SkSurface::draw(GrDeferredDisplayList*).
 */
class GrDeferredDisplayList : public SkNVRefCnt<GrDeferredDisplayList> {
public:
    SK_API ~GrDeferredDisplayList();

    SK_API const GrSurfaceCharacterization& characterization() const {
        return fCharacterization;
    }
    /**
     * Iterate through the programs required by the DDL.
     */
    class SK_API ProgramIterator {
    public:
        ProgramIterator(GrDirectContext*, GrDeferredDisplayList*);
        ~ProgramIterator();

        // This returns true if any work was done. Getting a cache hit does not count as work.
        bool compile();
        bool done() const;
        void next();

    private:
        GrDirectContext*                                 fDContext;
        const skia_private::TArray<GrRecordingContext::ProgramData>& fProgramData;
        int                                              fIndex;
    };

    // Provides access to functions that aren't part of the public API.
    GrDeferredDisplayListPriv priv();
    const GrDeferredDisplayListPriv priv() const;  // NOLINT(readability-const-return-type)

private:
    friend class GrDrawingManager; // for access to 'fRenderTasks', 'fLazyProxyData', 'fArenas'
    friend class GrDeferredDisplayListRecorder; // for access to 'fLazyProxyData'
    friend class GrDeferredDisplayListPriv;

    // This object is the source from which the lazy proxy backing the DDL will pull its backing
    // texture when the DDL is replayed. It has to be separately ref counted bc the lazy proxy
    // can outlive the DDL.
    class LazyProxyData : public SkRefCnt {
    public:
        // Upon being replayed - this field will be filled in (by the DrawingManager) with the
        // proxy backing the destination SkSurface. Note that, since there is no good place to
        // clear it, it can become a dangling pointer. Additionally, since the renderTargetProxy
        // doesn't get a ref here, the SkSurface that owns it must remain alive until the DDL
        // is flushed.
        // TODO: the drawing manager could ref the renderTargetProxy for the DDL and then add
        // a renderingTask to unref it after the DDL's ops have been executed.
        GrRenderTargetProxy* fReplayDest = nullptr;
    };

    SK_API GrDeferredDisplayList(const GrSurfaceCharacterization& characterization,
                                 sk_sp<GrRenderTargetProxy> fTargetProxy,
                                 sk_sp<LazyProxyData>);

    const skia_private::TArray<GrRecordingContext::ProgramData>& programData() const {
        return fProgramData;
    }

    const GrSurfaceCharacterization fCharacterization;

    // These are ordered such that the destructor cleans op tasks up first (which may refer back
    // to the arena and memory pool in their destructors).
    GrRecordingContext::OwnedArenas fArenas;
    skia_private::TArray<sk_sp<GrRenderTask>>   fRenderTasks;

    skia_private::TArray<GrRecordingContext::ProgramData> fProgramData;
    sk_sp<GrRenderTargetProxy>      fTargetProxy;
    sk_sp<LazyProxyData>            fLazyProxyData;
};

namespace skgpu::ganesh {
/** Draws the deferred display list created via a GrDeferredDisplayListRecorder.
    If the deferred display list is not compatible with the surface, the draw is skipped
    and false is return.

    The xOffset and yOffset parameters are experimental and, if not both zero, will cause
    the draw to be ignored.
    When implemented, if xOffset or yOffset are non-zero, the DDL will be drawn offset by that
    amount into the surface.

    @param SkSurface            The surface to apply the commands to, cannot be nullptr.
    @param ddl                  drawing commands, cannot be nullptr.
    @return                     false if ddl is not compatible

    example: https://fiddle.skia.org/c/@Surface_draw_2
*/
SK_API bool DrawDDL(SkSurface*,
                    sk_sp<const GrDeferredDisplayList> ddl);

SK_API bool DrawDDL(sk_sp<SkSurface>,
                    sk_sp<const GrDeferredDisplayList> ddl);
}

#endif
