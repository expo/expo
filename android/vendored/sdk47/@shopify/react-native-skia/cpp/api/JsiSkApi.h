#pragma once

#include "RNSkPlatformContext.h"

#include "JsiSkHostObjects.h"

#include "JsiSkRuntimeEffect.h"
#include "JsiSkColorFilter.h"
#include "JsiSkColorFilterFactory.h"
#include "JsiSkFont.h"
#include "JsiSkImage.h"
#include "JsiSkImageFactory.h"
#include "JsiSkImageFilter.h"
#include "JsiSkImageFilterFactory.h"
#include "JsiSkMaskFilter.h"
#include "JsiSkMaskFilterFactory.h"
#include "JsiSkMatrix.h"
#include "JsiSkPaint.h"
#include "JsiSkRSXform.h"
#include "JsiSkPath.h"
#include "JsiSkPathEffect.h"
#include "JsiSkPathEffectFactory.h"
#include "JsiSkPathFactory.h"
#include "JsiSkPoint.h"
#include "JsiSkRRect.h"
#include "JsiSkRect.h"
#include "JsiSkRuntimeEffectFactory.h"
#include "JsiSkShader.h"
#include "JsiSkShaderFactory.h"
#include "JsiSkSVG.h"
#include "JsiSkSVGFactory.h"
#include "JsiSkTypeface.h"
#include "JsiSkVertices.h"
#include "JsiSkTypefaceFactory.h"
#include "JsiSkDataFactory.h"
#include "JsiSkSurfaceFactory.h"
#include "JsiSkTextBlobFactory.h"
#include "JsiSkContourMeasureIter.h"
#include "JsiSkPictureRecorder.h"
#include "JsiSkPictureFactory.h"
#include "JsiSkRuntimeShaderBuilder.h"
#include "JsiSkColor.h"

namespace RNSkia
{

  using namespace facebook;

  class JsiSkApi : public JsiSkHostObject
  {
  public:
    /**
   * Constructs the Skia Api object that can be installed into a runtime
   * and provide functions for accessing and creating the Skia wrapper objects
   * @param context Platform context
   */
    JsiSkApi(jsi::Runtime &runtime, std::shared_ptr<RNSkPlatformContext> context)
        : JsiSkHostObject(context)
    {

      installFunction("Font", JsiSkFont::createCtor(context));
      installFunction("Paint", JsiSkPaint::createCtor(context));
      installFunction("RSXform", JsiSkRSXform::createCtor(context));
      installFunction("Matrix", JsiSkMatrix::createCtor(context));
      installFunction("XYWHRect", JsiSkRect::createCtor(context));
      installFunction("RRectXY", JsiSkRRect::createCtor(context));
      installFunction("Point", JsiSkPoint::createCtor(context));
      installFunction("RuntimeShaderBuilder", JsiSkRuntimeShaderBuilder::createCtor(context));
      installFunction("ContourMeasureIter", JsiSkContourMeasureIter::createCtor(context));
      installFunction("MakeVertices", JsiSkVertices::createCtor(context));
      installFunction("PictureRecorder", JsiSkPictureRecorder::createCtor(context));
      installFunction("Color", JsiSkColor::createCtor());

      installReadonlyProperty("SVG",
                              std::make_shared<JsiSkSVGFactory>(context));
      installReadonlyProperty("Image",
                              std::make_shared<JsiSkImageFactory>(context));
      installReadonlyProperty("Typeface",
                              std::make_shared<JsiSkTypefaceFactory>(context));
      installReadonlyProperty("Data",
                              std::make_shared<JsiSkDataFactory>(context));
      installReadonlyProperty("ImageFilter",
                              std::make_shared<JsiSkImageFilterFactory>(context));
      installReadonlyProperty("PathEffect",
                              std::make_shared<JsiSkPathEffectFactory>(context));
      installReadonlyProperty("Path",
                              std::make_shared<JsiSkPathFactory>(context));
      installReadonlyProperty("ColorFilter",
                              std::make_shared<JsiSkColorFilterFactory>(context));
      installReadonlyProperty("MaskFilter",
                              std::make_shared<JsiSkMaskFilterFactory>(context));
      installReadonlyProperty(
          "RuntimeEffect", std::make_shared<JsiSkRuntimeEffectFactory>(context));
      installReadonlyProperty("Shader",
                              std::make_shared<JsiSkShaderFactory>(context));
      installReadonlyProperty("TextBlob", std::make_shared<JsiSkTextBlobFactory>(context));
      installReadonlyProperty("Surface", std::make_shared<JsiSkSurfaceFactory>(context));
      installReadonlyProperty("Picture", std::make_shared<JsiSkPictureFactory>(context));
    };
  };
} // namespace RNSkia
