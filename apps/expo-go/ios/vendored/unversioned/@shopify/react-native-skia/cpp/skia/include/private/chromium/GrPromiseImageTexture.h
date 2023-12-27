/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrPromiseImageTexture_DEFINED
#define GrPromiseImageTexture_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkTypes.h"
#include "include/gpu/GrBackendSurface.h"
/**
 * This type is used to fulfill textures for PromiseImages. Once an instance is returned from a
 * PromiseImageTextureFulfillProc the GrBackendTexture it wraps must remain valid until the
 * corresponding PromiseImageTextureReleaseProc is called.
 */
class SK_API GrPromiseImageTexture : public SkNVRefCnt<GrPromiseImageTexture> {
public:
    GrPromiseImageTexture() = delete;
    GrPromiseImageTexture(const GrPromiseImageTexture&) = delete;
    GrPromiseImageTexture(GrPromiseImageTexture&&) = delete;
    ~GrPromiseImageTexture();
    GrPromiseImageTexture& operator=(const GrPromiseImageTexture&) = delete;
    GrPromiseImageTexture& operator=(GrPromiseImageTexture&&) = delete;

    static sk_sp<GrPromiseImageTexture> Make(const GrBackendTexture& backendTexture) {
        if (!backendTexture.isValid()) {
            return nullptr;
        }
        return sk_sp<GrPromiseImageTexture>(new GrPromiseImageTexture(backendTexture));
    }

    GrBackendTexture backendTexture() const { return fBackendTexture; }

private:
    explicit GrPromiseImageTexture(const GrBackendTexture& backendTexture);

    GrBackendTexture fBackendTexture;
};

#endif // GrPromiseImageTexture_DEFINED
