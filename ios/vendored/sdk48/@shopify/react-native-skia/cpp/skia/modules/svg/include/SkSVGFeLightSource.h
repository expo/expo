/*
 * Copyright 2021 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGFeLightSource_DEFINED
#define SkSVGFeLightSource_DEFINED

#include "include/core/SkPoint3.h"
#include "modules/svg/include/SkSVGHiddenContainer.h"
#include "modules/svg/include/SkSVGTypes.h"

class SkSVGFeLightSource : public SkSVGHiddenContainer {
public:
    void appendChild(sk_sp<SkSVGNode>) final {
        SkDebugf("cannot append child nodes to an SVG light source.\n");
    }

protected:
    explicit SkSVGFeLightSource(SkSVGTag tag) : INHERITED(tag) {}

private:
    using INHERITED = SkSVGHiddenContainer;
};

class SkSVGFeDistantLight final : public SkSVGFeLightSource {
public:
    static sk_sp<SkSVGFeDistantLight> Make() {
        return sk_sp<SkSVGFeDistantLight>(new SkSVGFeDistantLight());
    }

    SkPoint3 computeDirection() const;

    SVG_ATTR(Azimuth  , SkSVGNumberType, 0)
    SVG_ATTR(Elevation, SkSVGNumberType, 0)

private:
    SkSVGFeDistantLight() : INHERITED(SkSVGTag::kFeDistantLight) {}

    bool parseAndSetAttribute(const char*, const char*) override;

    using INHERITED = SkSVGFeLightSource;
};

class SkSVGFePointLight final : public SkSVGFeLightSource {
public:
    static sk_sp<SkSVGFePointLight> Make() {
        return sk_sp<SkSVGFePointLight>(new SkSVGFePointLight());
    }

    SVG_ATTR(X, SkSVGNumberType, 0)
    SVG_ATTR(Y, SkSVGNumberType, 0)
    SVG_ATTR(Z, SkSVGNumberType, 0)

private:
    SkSVGFePointLight() : INHERITED(SkSVGTag::kFePointLight) {}

    bool parseAndSetAttribute(const char*, const char*) override;

    using INHERITED = SkSVGFeLightSource;
};

class SkSVGFeSpotLight final : public SkSVGFeLightSource {
public:
    static sk_sp<SkSVGFeSpotLight> Make() {
        return sk_sp<SkSVGFeSpotLight>(new SkSVGFeSpotLight());
    }

    SVG_ATTR(X               , SkSVGNumberType, 0)
    SVG_ATTR(Y               , SkSVGNumberType, 0)
    SVG_ATTR(Z               , SkSVGNumberType, 0)
    SVG_ATTR(PointsAtX       , SkSVGNumberType, 0)
    SVG_ATTR(PointsAtY       , SkSVGNumberType, 0)
    SVG_ATTR(PointsAtZ       , SkSVGNumberType, 0)
    SVG_ATTR(SpecularExponent, SkSVGNumberType, 1)

    SVG_OPTIONAL_ATTR(LimitingConeAngle, SkSVGNumberType)

private:
    SkSVGFeSpotLight() : INHERITED(SkSVGTag::kFeSpotLight) {}

    bool parseAndSetAttribute(const char*, const char*) override;

    using INHERITED = SkSVGFeLightSource;
};

#endif  // SkSVGFeLightSource_DEFINED
