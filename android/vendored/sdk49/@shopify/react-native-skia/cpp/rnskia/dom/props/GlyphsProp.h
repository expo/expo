#pragma once

#include "DerivedNodeProp.h"
#include "PointProp.h"

#include <memory>
#include <utility>
#include <vector>

namespace RNSkia {

static PropId PropNamePos = JsiPropId::get("pos");
static PropId PropNameId = JsiPropId::get("id");

struct GlyphInfo {
  std::vector<SkGlyphID> glyphIds;
  std::vector<SkPoint> positions;
};

class GlyphsProp : public DerivedProp<GlyphInfo> {
public:
  explicit GlyphsProp(PropId name,
                      const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<GlyphInfo>(onChange) {
    _glyphsProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    auto arr = _glyphsProp->value().getAsArray();

    GlyphInfo glyphInfo;

    std::vector<SkGlyphID> glyphIds;
    std::vector<SkPoint> positions;

    glyphIds.reserve(arr.size());
    positions.reserve(arr.size());

    for (size_t i = 0; i < arr.size(); ++i) {
      auto obj = arr[i];
      auto pos = PointProp::processValue(obj.getValue(PropNamePos));
      auto identifier =
          static_cast<SkGlyphID>(obj.getValue(PropNameId).getAsNumber());
      glyphInfo.positions.push_back(pos);
      glyphInfo.glyphIds.push_back(identifier);
    }

    setDerivedValue(std::move(glyphInfo));
  }

private:
  NodeProp *_glyphsProp;
};

} // namespace RNSkia
