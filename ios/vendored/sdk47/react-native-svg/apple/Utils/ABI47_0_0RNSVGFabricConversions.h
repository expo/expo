#import "ABI47_0_0RNSVGContextBrush.h"
#import "ABI47_0_0RNSVGGroup.h"
#import "ABI47_0_0RNSVGLength.h"
#import "ABI47_0_0RNSVGPainterBrush.h"
#import "ABI47_0_0RNSVGRenderable.h"
#import "ABI47_0_0RNSVGSolidColorBrush.h"
#import "ABI47_0_0RNSVGText.h"
#import "ABI47_0_0RNSVGVBMOS.h"

#import <ABI47_0_0React/ABI47_0_0RCTConversions.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>

template <typename T>
ABI47_0_0RNSVGBrush *brushFromColorStruct(T fillObject)
{
  int type = fillObject.type;

  switch (type) {
    case -1: // empty struct
      return nil;
    case 0: // solid color
    {
      // These are probably expensive allocations since it's often the same value.
      // We should memoize colors but look ups may be just as expensive.
      ABI47_0_0RNSVGColor *color = ABI47_0_0RCTUIColorFromSharedColor(fillObject.payload) ?: [ABI47_0_0RNSVGColor clearColor];
      return [[ABI47_0_0RNSVGSolidColorBrush alloc] initWithColor:color];
    }
    case 1: // brush
    {
      NSArray *arr = @[ @(type), ABI47_0_0RCTNSStringFromString(fillObject.brushRef) ];
      return [[ABI47_0_0RNSVGPainterBrush alloc] initWithArray:arr];
    }
    case 2: // currentColor
      return [[ABI47_0_0RNSVGBrush alloc] initWithArray:nil];
    case 3: // context-fill
      return [[ABI47_0_0RNSVGContextBrush alloc] initFill];
    case 4: // context-stroke
      return [[ABI47_0_0RNSVGContextBrush alloc] initStroke];
    default:
      ABI47_0_0RCTLogError(@"Unknown brush type: %d", type);
      return nil;
  }
}

template <typename T>
void setCommonNodeProps(T nodeProps, ABI47_0_0RNSVGNode *node)
{
  node.name = ABI47_0_0RCTNSStringFromStringNilIfEmpty(nodeProps.name);
  node.opacity = nodeProps.opacity;
  if (nodeProps.matrix.size() == 6) {
    node.matrix = CGAffineTransformMake(
        nodeProps.matrix.at(0),
        nodeProps.matrix.at(1),
        nodeProps.matrix.at(2),
        nodeProps.matrix.at(3),
        nodeProps.matrix.at(4),
        nodeProps.matrix.at(5));
  }
  CATransform3D transform3d = ABI47_0_0RCTCATransform3DFromTransformMatrix(nodeProps.transform);
  CGAffineTransform transform = CATransform3DGetAffineTransform(transform3d);
  node.invTransform = CGAffineTransformInvert(transform);
  node.transforms = transform;
  node.mask = ABI47_0_0RCTNSStringFromStringNilIfEmpty(nodeProps.mask);
  node.markerStart = ABI47_0_0RCTNSStringFromStringNilIfEmpty(nodeProps.markerStart);
  node.markerMid = ABI47_0_0RCTNSStringFromStringNilIfEmpty(nodeProps.markerMid);
  node.markerEnd = ABI47_0_0RCTNSStringFromStringNilIfEmpty(nodeProps.markerEnd);
  node.clipPath = ABI47_0_0RCTNSStringFromStringNilIfEmpty(nodeProps.clipPath);
  node.clipRule = nodeProps.clipRule == 0 ? kRNSVGCGFCRuleEvenodd : kRNSVGCGFCRuleNonzero;
  node.responsible = nodeProps.responsible;
  // onLayout
  node.display = ABI47_0_0RCTNSStringFromStringNilIfEmpty(nodeProps.display);
  std::string pointerEvents = nodeProps.pointerEvents;
  NSString *pointerEventsString = ABI47_0_0RCTNSStringFromStringNilIfEmpty(pointerEvents);
  if ([pointerEventsString isEqualToString:@"auto"]) {
    node.pointerEvents = ABI47_0_0RCTPointerEventsUnspecified;
  } else if ([pointerEventsString isEqualToString:@"none"]) {
    node.pointerEvents = ABI47_0_0RCTPointerEventsNone;
  } else if ([pointerEventsString isEqualToString:@"box-none"]) {
    node.pointerEvents = ABI47_0_0RCTPointerEventsNone;
  } else if ([pointerEventsString isEqualToString:@"box-only"]) {
    node.pointerEvents = ABI47_0_0RCTPointerEventsNone;
  } else {
    node.pointerEvents = ABI47_0_0RCTPointerEventsUnspecified;
  }
}

static NSMutableArray<ABI47_0_0RNSVGLength *> *createLengthArrayFromStrings(std::vector<std::string> stringArray)
{
  if (stringArray.empty()) {
    return nil;
  }
  NSMutableArray<ABI47_0_0RNSVGLength *> *lengthArray = [NSMutableArray new];
  for (auto str : stringArray) {
    ABI47_0_0RNSVGLength *lengthFromString = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(str)];
    [lengthArray addObject:lengthFromString];
  }
  return lengthArray;
}

template <typename T>
void setCommonRenderableProps(T renderableProps, ABI47_0_0RNSVGRenderable *renderableNode)
{
  setCommonNodeProps(renderableProps, renderableNode);
  renderableNode.fill = brushFromColorStruct(renderableProps.fill);
  renderableNode.fillOpacity = renderableProps.fillOpacity;
  renderableNode.fillRule = renderableProps.fillRule == 0 ? kRNSVGCGFCRuleEvenodd : kRNSVGCGFCRuleNonzero;
  renderableNode.stroke = brushFromColorStruct(renderableProps.stroke);
  renderableNode.strokeOpacity = renderableProps.strokeOpacity;
  renderableNode.strokeWidth = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(renderableProps.strokeWidth)];
  renderableNode.strokeLinecap = renderableProps.strokeLinecap == 0 ? kCGLineCapButt
      : renderableProps.strokeLinecap == 1                          ? kCGLineCapRound
                                                                    : kCGLineCapSquare;
  renderableNode.strokeLinejoin = renderableProps.strokeLinejoin == 0 ? kCGLineJoinMiter
      : renderableProps.strokeLinejoin == 1                           ? kCGLineJoinRound
                                                                      : kCGLineJoinBevel;
  renderableNode.strokeDasharray = createLengthArrayFromStrings(renderableProps.strokeDasharray);
  renderableNode.strokeDashoffset = renderableProps.strokeDashoffset;
  renderableNode.strokeMiterlimit = renderableProps.strokeMiterlimit;
  renderableNode.vectorEffect = renderableProps.vectorEffect == 0 ? kRNSVGVectorEffectDefault
      : renderableProps.vectorEffect == 1                         ? kRNSVGVectorEffectNonScalingStroke
      : renderableProps.vectorEffect == 2                         ? kRNSVGVectorEffectInherit
                                                                  : kRNSVGVectorEffectUri;
  if (renderableProps.propList.size() > 0) {
    NSMutableArray<NSString *> *propArray = [NSMutableArray new];
    for (auto str : renderableProps.propList) {
      [propArray addObject:ABI47_0_0RCTNSStringFromString(str)];
    }
    renderableNode.propList = propArray;
  }
}

static void addValueToDict(NSMutableDictionary *dict, std::string value, NSString *key)
{
  NSString *valueOrNil = ABI47_0_0RCTNSStringFromStringNilIfEmpty(value);
  if (valueOrNil) {
    dict[key] = valueOrNil;
  }
}

template <typename T>
NSDictionary *parseFontStruct(T fontStruct)
{
  NSMutableDictionary *fontDict = [NSMutableDictionary new];

  // TODO: do it better maybe
  addValueToDict(fontDict, fontStruct.fontStyle, @"fontStyle");
  addValueToDict(fontDict, fontStruct.fontVariant, @"fontVariant");
  addValueToDict(fontDict, fontStruct.fontWeight, @"fontWeight");
  addValueToDict(fontDict, fontStruct.fontStretch, @"fontStretch");
  addValueToDict(fontDict, fontStruct.fontSize, @"fontSize");
  addValueToDict(fontDict, fontStruct.fontFamily, @"fontFamily");
  addValueToDict(fontDict, fontStruct.textAnchor, @"textAnchor");
  addValueToDict(fontDict, fontStruct.textDecoration, @"textDecoration");
  addValueToDict(fontDict, fontStruct.letterSpacing, @"letterSpacing");
  addValueToDict(fontDict, fontStruct.wordSpacing, @"wordSpacing");
  addValueToDict(fontDict, fontStruct.kerning, @"kerning");
  addValueToDict(fontDict, fontStruct.fontFeatureSettings, @"fontFeatureSettings");
  addValueToDict(fontDict, fontStruct.fontVariantLigatures, @"fontVariantLigatures");
  addValueToDict(fontDict, fontStruct.fontVariationSettings, @"fontVariationSettings");
  return [NSDictionary dictionaryWithDictionary:fontDict];
}

template <typename T>
void setCommonGroupProps(T groupProps, ABI47_0_0RNSVGGroup *groupNode)
{
  setCommonRenderableProps(groupProps, groupNode);

  if (ABI47_0_0RCTNSStringFromStringNilIfEmpty(groupProps.fontSize)) {
    groupNode.font = @{@"fontSize" : ABI47_0_0RCTNSStringFromString(groupProps.fontSize)};
  }
  if (ABI47_0_0RCTNSStringFromStringNilIfEmpty(groupProps.fontWeight)) {
    groupNode.font = @{@"fontWeight" : ABI47_0_0RCTNSStringFromString(groupProps.fontWeight)};
  }
  NSDictionary *fontDict = parseFontStruct(groupProps.font);
  if (groupNode.font == nil || fontDict.count > 0) {
    // some of text's rendering logic requires that `font` is not nil so we always set it
    // even if to an empty dict
    groupNode.font = fontDict;
  }
}

template <typename T>
void setCommonTextProps(T textProps, ABI47_0_0RNSVGText *textNode)
{
  setCommonGroupProps(textProps, textNode);
  textNode.deltaX = createLengthArrayFromStrings(textProps.dx);
  textNode.deltaY = createLengthArrayFromStrings(textProps.dy);
  if (!textProps.x.empty()) {
    textNode.positionX = createLengthArrayFromStrings(textProps.x);
  }
  if (!textProps.y.empty()) {
    textNode.positionY = createLengthArrayFromStrings(textProps.y);
  }
  textNode.rotate = createLengthArrayFromStrings(textProps.rotate);
  textNode.inlineSize = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(textProps.inlineSize)];
  textNode.textLength = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(textProps.textLength)];
  textNode.baselineShift = ABI47_0_0RCTNSStringFromStringNilIfEmpty(textProps.baselineShift);
  textNode.lengthAdjust = ABI47_0_0RCTNSStringFromStringNilIfEmpty(textProps.lengthAdjust);
  textNode.alignmentBaseline = ABI47_0_0RCTNSStringFromStringNilIfEmpty(textProps.alignmentBaseline);
}

static ABI47_0_0RNSVGVBMOS intToRNSVGVBMOS(int value)
{
  switch (value) {
    case 0:
      return kRNSVGVBMOSMeet;
    case 1:
      return kRNSVGVBMOSSlice;
    case 2:
      return kRNSVGVBMOSNone;
    default:
      return kRNSVGVBMOSMeet;
  }
}
