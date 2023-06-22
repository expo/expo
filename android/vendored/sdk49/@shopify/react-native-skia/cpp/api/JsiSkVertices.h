#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <utility>
#include <vector>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkVertices.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkVertices : public JsiSkWrappingSkPtrHostObject<SkVertices> {
public:
  JsiSkVertices(std::shared_ptr<RNSkPlatformContext> context,
                sk_sp<SkVertices> vertices)
      : JsiSkWrappingSkPtrHostObject<SkVertices>(std::move(context),
                                                 std::move(vertices)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkVertices, "Vertices")

  JSI_HOST_FUNCTION(bounds) {
    const auto &result = getObject()->bounds();
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkRect>(getContext(), result));
  }

  JSI_HOST_FUNCTION(uniqueID) {
    return static_cast<double>(getObject()->uniqueID());
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkVertices, bounds),
                       JSI_EXPORT_FUNC(JsiSkVertices, uniqueID),
                       JSI_EXPORT_FUNC(JsiSkVertices, dispose))

  /**
   * Creates the function for construction a new instance of the SkVertices
   * wrapper
   * @param context platform context
   * @return A function for creating a new host object wrapper for the
   * SkVertices class
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      auto mode = static_cast<SkVertices::VertexMode>(arguments[0].getNumber());
      std::vector<SkPoint> positions;
      std::vector<SkPoint> texs;
      std::vector<SkColor> colors;
      std::vector<uint16_t> indices;

      auto jsiPositions = arguments[1].asObject(runtime).asArray(runtime);
      auto positionsSize = static_cast<int>(jsiPositions.size(runtime));
      positions.reserve(positionsSize);
      for (int i = 0; i < positionsSize; i++) {
        std::shared_ptr<SkPoint> point = JsiSkPoint::fromValue(
            runtime,
            jsiPositions.getValueAtIndex(runtime, i).asObject(runtime));
        positions.push_back(*point.get());
      }

      if (count >= 3 && !arguments[2].isNull() && !arguments[2].isUndefined()) {
        auto jsiTexs = arguments[2].asObject(runtime).asArray(runtime);
        auto texsSize = jsiTexs.size(runtime);
        texs.reserve(texsSize);
        for (int i = 0; i < texsSize; i++) {
          auto point = JsiSkPoint::fromValue(
              runtime, jsiTexs.getValueAtIndex(runtime, i).asObject(runtime));
          texs.push_back(*point.get());
        }
      }

      if (count >= 4 && !arguments[3].isNull() && !arguments[3].isUndefined()) {
        auto jsiColors = arguments[3].asObject(runtime).asArray(runtime);
        auto colorsSize = jsiColors.size(runtime);
        colors.reserve(colorsSize);
        for (int i = 0; i < colorsSize; i++) {
          SkColor color = JsiSkColor::fromValue(
              runtime, jsiColors.getValueAtIndex(runtime, i));
          colors.push_back(color);
        }
      }

      int indicesSize = 0;
      if (count >= 5 && !arguments[4].isNull() && !arguments[4].isUndefined()) {
        auto jsiIndices = arguments[4].asObject(runtime).asArray(runtime);
        indicesSize = static_cast<int>(jsiIndices.size(runtime));
        indices.reserve(indicesSize);
        for (int i = 0; i < indicesSize; i++) {
          uint16_t index = jsiIndices.getValueAtIndex(runtime, i).asNumber();
          indices.push_back(index);
        }
      }
      // TODO: this is the technic used in CanvasKit:
      // https://github.com/google/skia/blob/main/modules/canvaskit/interface.js#L1216
      // Note that the isVolatile parameter is unused when using MakeCopy()
      //                auto isVolatile = count >= 6 && !arguments[5].isNull()
      //                && !arguments[5].isUndefined() ? arguments[5].getBool()
      //                : false; auto flags = 0;
      //                // These flags are from SkVertices.h and should be kept
      //                in sync with those. if (texs.size() > 0) {
      //                    flags |= (1 << 0);
      //                }
      //                if (colors.size() > 0) {
      //                    flags |= (1 << 1);
      //                }
      //                if (!isVolatile) {
      //                    flags |= (1 << 2);
      //                }
      //                auto builder = SkVertices::Builder(mode,
      //                positionsSize/2, indicesSize, flags);
      //                std::copy(positions.data(), positions.data() +
      //                positionsSize, builder.positions()); if
      //                (builder.texCoords()) {
      //                    std::copy(std::begin(texs), std::end(texs),
      //                    builder.texCoords());
      //                }
      //                if (builder.colors()) {
      //                    std::copy(std::begin(colors), std::end(colors),
      //                    builder.colors());
      //                }
      //                if (builder.indices()) {
      //                    std::copy(std::begin(indices), std::end(indices),
      //                    builder.indices());
      //                }
      //                auto vertices = builder.detach();
      auto vertices = SkVertices::MakeCopy(
          mode, positionsSize, positions.data(), texs.data(), colors.data(),
          indicesSize, indices.data());
      return jsi::Object::createFromHostObject(
          runtime,
          std::make_shared<JsiSkVertices>(context, std::move(vertices)));
    };
  }
};
} // namespace RNSkia
