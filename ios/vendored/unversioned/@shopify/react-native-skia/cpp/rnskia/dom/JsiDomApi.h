#pragma once

/* Enable output of dom trees and paint contexts */
#define SKIA_DOM_DEBUG 0
#define SKIA_DOM_DEBUG_VERBOSE 0

#include <memory>

#include "JsiHostObject.h"

#include "base/JsiDependencyManager.h"

#include "nodes/JsiCircleNode.h"
#include "nodes/JsiDiffRectNode.h"
#include "nodes/JsiFillNode.h"
#include "nodes/JsiGroupNode.h"
#include "nodes/JsiImageNode.h"
#include "nodes/JsiLineNode.h"
#include "nodes/JsiOvalNode.h"
#include "nodes/JsiPatchNode.h"
#include "nodes/JsiPathNode.h"
#include "nodes/JsiPointsNode.h"
#include "nodes/JsiRRectNode.h"
#include "nodes/JsiRectNode.h"

#include "nodes/JsiBlurMaskNode.h"
#include "nodes/JsiImageSvgNode.h"
#include "nodes/JsiPictureNode.h"
#include "nodes/JsiVerticesNode.h"

#include "nodes/JsiColorFilterNodes.h"
#include "nodes/JsiImageFilterNodes.h"
#include "nodes/JsiPathEffectNodes.h"
#include "nodes/JsiShaderNodes.h"

#include "nodes/JsiPaintNode.h"

#include "nodes/JsiBackdropFilterNode.h"
#include "nodes/JsiBlendNode.h"
#include "nodes/JsiBoxNode.h"
#include "nodes/JsiBoxShadowNode.h"

#include "nodes/JsiCustomDrawingNode.h"

#include "nodes/JsiGlyphsNode.h"
#include "nodes/JsiTextBlobNode.h"
#include "nodes/JsiTextNode.h"
#include "nodes/JsiTextPathNode.h"

#include "nodes/JsiLayerNode.h"

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiDomApi : public JsiHostObject {
public:
  explicit JsiDomApi(std::shared_ptr<RNSkPlatformContext> context)
      : JsiHostObject() {
    installFunction("DependencyManager",
                    JsiDependencyManager::createCtor(context));

    // Shapes
    installFunction("RectNode", JsiRectNode::createCtor(context));
    installFunction("RRectNode", JsiRRectNode::createCtor(context));
    installFunction("CircleNode", JsiCircleNode::createCtor(context));
    installFunction("PathNode", JsiPathNode::createCtor(context));
    installFunction("LineNode", JsiLineNode::createCtor(context));
    installFunction("ImageNode", JsiImageNode::createCtor(context));
    installFunction("OvalNode", JsiOvalNode::createCtor(context));
    installFunction("PatchNode", JsiPatchNode::createCtor(context));
    installFunction("PointsNode", JsiPointsNode::createCtor(context));
    installFunction("DiffRectNode", JsiDiffRectNode::createCtor(context));

    installFunction("FillNode", JsiFillNode::createCtor(context));

    installFunction("GroupNode", JsiGroupNode::createCtor(context));

    installFunction("PaintNode", JsiPaintNode::createCtor(context));

    installFunction("BlurMaskFilterNode", JsiBlurMaskNode::createCtor(context));

    installFunction("PictureNode", JsiPictureNode::createCtor(context));
    installFunction("ImageSVGNode", JsiImageSvgNode::createCtor(context));

    installFunction("VerticesNode", JsiVerticesNode::createCtor(context));

    // Path effects
    installFunction("DashPathEffectNode",
                    JsiDashPathEffectNode::createCtor(context));
    installFunction("DiscretePathEffectNode",
                    JsiDiscretePathEffectNode::createCtor(context));
    installFunction("CornerPathEffectNode",
                    JsiCornerPathEffectNode::createCtor(context));
    installFunction("Path1DPathEffectNode",
                    JsiPath1DPathEffectNode::createCtor(context));
    installFunction("Path2DPathEffectNode",
                    JsiPath2DPathEffectNode::createCtor(context));
    installFunction("Line2DPathEffectNode",
                    JsiLine2DPathEffectNode::createCtor(context));
    installFunction("SumPathEffectNode",
                    JsiSumPathEffectNode::createCtor(context));

    // Image filters
    installFunction("DashPathEffectNode",
                    JsiBlendImageFilterNode::createCtor(context));
    installFunction("DropShadowImageFilterNode",
                    JsiDropShadowImageFilterNode::createCtor(context));
    installFunction("DisplacementMapImageFilterNode",
                    JsiDisplacementMapImageFilterNode::createCtor(context));
    installFunction("BlurImageFilterNode",
                    JsiBlurImageFilterNode::createCtor(context));
    installFunction("OffsetImageFilterNode",
                    JsiOffsetImageFilterNode::createCtor(context));
    installFunction("MorphologyImageFilterNode",
                    JsiMorphologyImageFilterNode::createCtor(context));
    installFunction("RuntimeShaderImageFilterNode",
                    JsiRuntimeShaderImageFilterNode::createCtor(context));

    // Color Filters
    installFunction("MatrixColorFilterNode",
                    JsiMatrixColorFilterNode::createCtor(context));
    installFunction("BlendColorFilterNode",
                    JsiBlendColorFilterNode::createCtor(context));
    installFunction("LinearToSRGBGammaColorFilterNode",
                    JsiLinearToSRGBGammaColorFilterNode::createCtor(context));
    installFunction("SRGBToLinearGammaColorFilterNode",
                    JsiSRGBToLinearGammaColorFilterNode::createCtor(context));
    installFunction("LumaColorFilterNode",
                    JsiLumaColorFilterNode::createCtor(context));
    installFunction("LerpColorFilterNode",
                    JsiLerpColorFilterNode::createCtor(context));

    // Shaders
    installFunction("ShaderNode", JsiShaderNode::createCtor(context));
    installFunction("ImageShaderNode", JsiImageShaderNode::createCtor(context));
    installFunction("ColorShaderNode", JsiColorShaderNode::createCtor(context));
    installFunction("TurbulenceNode", JsiTurbulenceNode::createCtor(context));
    installFunction("FractalNoiseNode",
                    JsiFractalNoiseNode::createCtor(context));
    installFunction("LinearGradientNode",
                    JsiLinearGradientNode::createCtor(context));
    installFunction("RadialGradientNode",
                    JsiRadialGradientNode::createCtor(context));
    installFunction("SweepGradientNode",
                    JsiSweepGradientNode::createCtor(context));
    installFunction("TwoPointConicalGradientNode",
                    JsiTwoPointConicalGradientNode::createCtor(context));

    installFunction("BackdropFilterNode",
                    JsiBackdropFilterNode::createCtor(context));
    installFunction("BlendNode", JsiBlendNode::createCtor(context));
    installFunction("BoxNode", JsiBoxNode::createCtor(context));
    installFunction("BoxShadowNode", JsiBoxShadowNode::createCtor(context));

    installFunction("CustomDrawingNode",
                    JsiCustomDrawingNode::createCtor(context));

    installFunction("GlyphsNode", JsiGlyphsNode::createCtor(context));
    installFunction("TextNode", JsiTextNode::createCtor(context));
    installFunction("TextPathNode", JsiTextPathNode::createCtor(context));
    installFunction("TextBlobNode", JsiTextBlobNode::createCtor(context));

    installFunction("LayerNode", JsiLayerNode::createCtor(context));
  }
};

} // namespace RNSkia
