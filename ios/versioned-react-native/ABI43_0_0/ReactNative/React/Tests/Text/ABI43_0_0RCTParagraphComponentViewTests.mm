/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTParagraphComponentAccessibilityProvider.h>
#import <ABI43_0_0React/ABI43_0_0RCTParagraphComponentView.h>

#import <XCTest/XCTest.h>
#import <ABI43_0_0React/ABI43_0_0renderer/attributedstring/AttributedString.h>
#import <ABI43_0_0React/ABI43_0_0renderer/attributedstring/ParagraphAttributes.h>
#import <ABI43_0_0React/ABI43_0_0renderer/attributedstring/TextAttributes.h>
#import <ABI43_0_0React/ABI43_0_0renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/root/RootComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/text/ParagraphComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/text/ParagraphShadowNode.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/text/ParagraphState.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/text/RawTextComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/text/RawTextShadowNode.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/text/TextComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/text/TextShadowNode.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/view/ViewComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/element/ComponentBuilder.h>
#import <ABI43_0_0React/ABI43_0_0renderer/element/Element.h>
#import <ABI43_0_0React/ABI43_0_0renderer/element/testUtils.h>
#import <ABI43_0_0React/ABI43_0_0renderer/textlayoutmanager/ABI43_0_0RCTTextLayoutManager.h>
#import <ABI43_0_0React/ABI43_0_0renderer/textlayoutmanager/TextLayoutManager.h>

@interface ABI43_0_0RCTParagraphComponentAccessibilityProviderTests : XCTestCase

@end

using namespace ABI43_0_0facebook::ABI43_0_0React;

//┌──    RootShadowNode    ─────────────────────────────┐
//│                                                     │
//│┌─── ParagraphShadowNodeA ─────────────────────────┐ │
//││ ┌─AA(AAA) ─────────┐ ┌─AB(ABA) ─┐ ┌─AC(ACA)────┐ │ │
//││ │ Please check out │ │ Facebook │ │    and     │ │ │
//││ └──────────────────┘ └──────────┘ └────────────┘ │ │
//││ ┌─AD(ADA) ──┐ ┌──AE(AEA) ──────────────────────┐ │ │
//││ │ Instagram │ │    for a full description.     │ │ │
//││ └───────────┘ └────────────────────────────────┘ │ │
//│└──────────────────────────────────────────────────┘ │
//│                                                     │
//│                                                     │
//│┌── ParagraphShadowNodeB ──────────────────────────┐ │
//││ ┌───BA(BAA) ───────────────────────────────────┐ │ │
//││ │   Lorem ipsum dolor sit amet, consectetur    │ │ │
//││ │ adipiscing elit. Maecenas ut risus et sapien │ │ │
//││ │   bibendum volutpat. Nulla facilisi. Cras    │ │ │
//││ │         imperdiet gravida tincidunt.         │ │ │
//││ └──────────────────────────────────────────────┘ │ │
//││ ┌─BB(BBA) ─────────────────────────────────────┐ │ │
//││ │  In tempor, tellus et vestibulum venenatis,  │ │ │
//││ │  lorem nunc eleifend lectus, a consectetur   │ │ │
//││ │             magna augue at arcu.             │ │ │
//││ └──────────────────────────────────────────────┘ │ │
//│└──────────────────────────────────────────────────┘ │
//│                                                     │
//│┌── ParagraphShadowNodeC ──────────────────────────┐ │
//││  ┌─CA(CAA) ────────┐                             │ │
//││  │   Lorem ipsum   │                             │ │
//││  └─────────────────┘                             │ │
//││ ┌─CB(CBA) ─────────────────────────────────────┐ │ │
//││ │ dolor sit amet, consectetur adipiscing elit. │ │ │
//││ │Maecenas ut risus et sapien bibendum volutpat.│ │ │
//││ │    Nulla facilisi. Cras imperdiet gravida    │ │ │
//││ │  tincidunt. In tempor, tellus et vestibulum  │ │ │
//││ │   venenatis, lorem nunc eleifend lectus, a   │ │ │
//││ │       consectetur magna augue at arcu.       │ │ │
//││ └──────────────────────────────────────────────┘ │ │
//││ ┌─CC(CCA) ────────┐                              │ │
//││ │    See Less     │                              │ │
//││ └─────────────────┘                              │ │
//│└──────────────────────────────────────────────────┘ │
//│                                                     │
//└─────────────────────────────────────────────────────┘

@implementation ABI43_0_0RCTParagraphComponentAccessibilityProviderTests {
  std::shared_ptr<ComponentBuilder> builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ParagraphShadowNode> ParagrahShadowNodeA_;
  std::shared_ptr<ParagraphShadowNode> ParagrahShadowNodeB_;
  std::shared_ptr<ParagraphShadowNode> ParagrahShadowNodeC_;
  std::shared_ptr<TextShadowNode> TextShadowNodeAA_;
  std::shared_ptr<TextShadowNode> TextShadowNodeAB_;
  std::shared_ptr<TextShadowNode> TextShadowNodeAC_;
  std::shared_ptr<TextShadowNode> TextShadowNodeAD_;
  std::shared_ptr<TextShadowNode> TextShadowNodeAE_;
  std::shared_ptr<TextShadowNode> TextShadowNodeBA_;
  std::shared_ptr<TextShadowNode> TextShadowNodeBB_;
  std::shared_ptr<TextShadowNode> TextShadowNodeCA_;
  std::shared_ptr<TextShadowNode> TextShadowNodeCB_;
  std::shared_ptr<TextShadowNode> TextShadowNodeCC_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeAAA_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeABA_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeACA_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeADA_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeAEA_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeBAA_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeBBA_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeCAA_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeCBA_;
  std::shared_ptr<RawTextShadowNode> RawTextShadowNodeCCA_;
}

- (void)setUp
{
  [super setUp];
  builder_ = std::make_shared<ComponentBuilder>((simpleComponentBuilder()));
  auto element =
      Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .props([] {
            auto sharedProps = std::make_shared<RootProps>();
            auto &props = *sharedProps;
            props.layoutConstraints = LayoutConstraints{{0, 0}, {500, 500}};
            auto &yogaStyle = props.yogaStyle;
            yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{200, ABI43_0_0YGUnitPoint};
            yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{200, ABI43_0_0YGUnitPoint};
            return sharedProps;
          })
          .children({
              Element<ParagraphShadowNode>()
                  .reference(ParagrahShadowNodeA_)
                  .props([] {
                    auto sharedProps = std::make_shared<ParagraphProps>();
                    auto &props = *sharedProps;
                    auto &yogaStyle = props.yogaStyle;
                    yogaStyle.positionType() = ABI43_0_0YGPositionTypeAbsolute;
                    yogaStyle.position()[ABI43_0_0YGEdgeLeft] = ABI43_0_0YGValue{0, ABI43_0_0YGUnitPoint};
                    yogaStyle.position()[ABI43_0_0YGEdgeTop] = ABI43_0_0YGValue{0, ABI43_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{200, ABI43_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{20, ABI43_0_0YGUnitPoint};
                    return sharedProps;
                  })
                  .children({
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeAA_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeAAA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text = "Please check out ";
                            return sharedProps;
                          })}),
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeAB_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            auto &props = *sharedProps;
                            props.textAttributes.accessibilityRole = AccessibilityRole::Link;
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeABA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text = "facebook";
                            return sharedProps;
                          })}),
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeAC_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeACA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text = " and ";
                            return sharedProps;
                          })}),
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeAD_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            auto &props = *sharedProps;
                            props.textAttributes.accessibilityRole = AccessibilityRole::Link;
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeADA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text = "instagram";
                            return sharedProps;
                          })}),
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeAE_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeAEA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text = " for a full description.";
                            return sharedProps;
                          })}),
                  }),
              Element<ParagraphShadowNode>()
                  .reference(ParagrahShadowNodeB_)
                  .props([] {
                    auto sharedProps = std::make_shared<ParagraphProps>();
                    auto &props = *sharedProps;
                    auto &yogaStyle = props.yogaStyle;
                    yogaStyle.positionType() = ABI43_0_0YGPositionTypeAbsolute;
                    yogaStyle.position()[ABI43_0_0YGEdgeLeft] = ABI43_0_0YGValue{0, ABI43_0_0YGUnitPoint};
                    yogaStyle.position()[ABI43_0_0YGEdgeTop] = ABI43_0_0YGValue{30, ABI43_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{200, ABI43_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{50, ABI43_0_0YGUnitPoint};
                    return sharedProps;
                  })
                  .children({
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeBA_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            auto &props = *sharedProps;
                            props.textAttributes.accessibilityRole = AccessibilityRole::Link;
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeBAA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text =
                                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas ut risus et sapien bibendum volutpat. Nulla facilisi. Cras imperdiet gravida tincidunt. ";
                            return sharedProps;
                          })}),
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeBB_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeBBA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text =
                                "In tempor, tellus et vestibulum venenatis, lorem nunc eleifend lectus, a consectetur magna augue at arcu.";
                            return sharedProps;
                          })}),
                  }),
              Element<ParagraphShadowNode>()
                  .reference(ParagrahShadowNodeC_)
                  .props([] {
                    auto sharedProps = std::make_shared<ParagraphProps>();
                    auto &props = *sharedProps;
                    auto &yogaStyle = props.yogaStyle;
                    yogaStyle.positionType() = ABI43_0_0YGPositionTypeAbsolute;
                    yogaStyle.position()[ABI43_0_0YGEdgeLeft] = ABI43_0_0YGValue{0, ABI43_0_0YGUnitPoint};
                    yogaStyle.position()[ABI43_0_0YGEdgeTop] = ABI43_0_0YGValue{90, ABI43_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{200, ABI43_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{50, ABI43_0_0YGUnitPoint};
                    return sharedProps;
                  })
                  .children({
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeCA_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            auto &props = *sharedProps;
                            props.textAttributes.accessibilityRole = AccessibilityRole::Link;
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeCAA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text = "Lorem ipsum";
                            return sharedProps;
                          })}),
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeCB_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeCBA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text =
                                " dolor sit amet, consectetur adipiscing elit. Maecenas ut risus et sapien bibendum volutpat. Nulla facilisi. Cras imperdiet gravida tincidunt. In tempor, tellus et vestibulum venenatis, lorem nunc eleifend lectus, a consectetur magna augue at arcu. ";
                            return sharedProps;
                          })}),
                      Element<TextShadowNode>()
                          .reference(TextShadowNodeCC_)
                          .props([] {
                            auto sharedProps = std::make_shared<TextProps>();
                            auto &props = *sharedProps;
                            props.textAttributes.accessibilityRole = AccessibilityRole::Button;
                            return sharedProps;
                          })
                          .children({Element<RawTextShadowNode>().reference(RawTextShadowNodeCCA_).props([] {
                            auto sharedProps = std::make_shared<RawTextProps>();
                            auto &props = *sharedProps;
                            props.text = "See Less";
                            return sharedProps;
                          })}),
                  }),
          });
  builder_->build(element);
  rootShadowNode_->layoutIfNeeded();
}

static ParagraphShadowNode::ConcreteState::Shared stateWithShadowNode(
    std::shared_ptr<ParagraphShadowNode> paragraphShadowNode)
{
  auto sharedState =
      std::static_pointer_cast<ParagraphShadowNode::ConcreteState const>(paragraphShadowNode->getState());
  return sharedState;
}

- (void)testAttributedString
{
  ParagraphShadowNode::ConcreteState::Shared _stateA = stateWithShadowNode(ParagrahShadowNodeA_);
  ABI43_0_0RCTParagraphComponentView *paragraphComponentViewA = [[ABI43_0_0RCTParagraphComponentView alloc] init];
  [paragraphComponentViewA updateState:_stateA oldState:nil];

  ParagraphShadowNode::ConcreteState::Shared _stateB = stateWithShadowNode(ParagrahShadowNodeB_);
  ABI43_0_0RCTParagraphComponentView *paragraphComponentViewB = [[ABI43_0_0RCTParagraphComponentView alloc] init];
  [paragraphComponentViewB updateState:_stateB oldState:nil];

  ParagraphShadowNode::ConcreteState::Shared _stateC = stateWithShadowNode(ParagrahShadowNodeC_);
  ABI43_0_0RCTParagraphComponentView *paragraphComponentViewC = [[ABI43_0_0RCTParagraphComponentView alloc] init];
  [paragraphComponentViewC updateState:_stateC oldState:nil];

  // Check the correctness of attributedString
  XCTAssert([[paragraphComponentViewA.attributedText string]
      isEqual:@"Please check out facebook and instagram for a full description."]);
  XCTAssertEqual(_stateA->getData().attributedString.getFragments().size(), 5);

  XCTAssert([[paragraphComponentViewB.attributedText string]
      isEqual:
          @"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas ut risus et sapien bibendum volutpat. Nulla facilisi. Cras imperdiet gravida tincidunt. In tempor, tellus et vestibulum venenatis, lorem nunc eleifend lectus, a consectetur magna augue at arcu."]);
  XCTAssertEqual(_stateB->getData().attributedString.getFragments().size(), 2);

  XCTAssert([[paragraphComponentViewC.attributedText string]
      isEqual:
          @"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas ut risus et sapien bibendum volutpat. Nulla facilisi. Cras imperdiet gravida tincidunt. In tempor, tellus et vestibulum venenatis, lorem nunc eleifend lectus, a consectetur magna augue at arcu. See Less"]);
  XCTAssertEqual(_stateC->getData().attributedString.getFragments().size(), 3);
}

#pragma mark - Accessibility

- (void)testAccessibilityMultipleLinks
{
  // initialize the paragraphComponentView to get the accessibilityElements
  ParagraphShadowNode::ConcreteState::Shared _state = stateWithShadowNode(ParagrahShadowNodeA_);
  ABI43_0_0RCTParagraphComponentView *paragraphComponentView = [[ABI43_0_0RCTParagraphComponentView alloc] init];
  [paragraphComponentView updateState:_state oldState:nil];

  NSArray<UIAccessibilityElement *> *elements = [paragraphComponentView accessibilityElements];

  // check the number of accessibilityElements
  XCTAssert(
      elements.count == 3, @"Expected 4 accessibilityElements - one for the whole string, and the rest for the links");
  // check accessibility trait
  XCTAssert(
      elements[1].accessibilityTraits & UIAccessibilityTraitLink,
      @"Expected the second accessibilityElement has link trait");
  XCTAssert(
      elements[2].accessibilityTraits & UIAccessibilityTraitLink,
      @"Expected the second accessibilityElement has link trait");
}

- (void)testAccessibilityLinkWrappingMultipleLines
{
  ParagraphShadowNode::ConcreteState::Shared _state = stateWithShadowNode(ParagrahShadowNodeB_);
  ABI43_0_0RCTParagraphComponentView *paragraphComponentView = [[ABI43_0_0RCTParagraphComponentView alloc] init];
  [paragraphComponentView updateState:_state oldState:nil];

  NSArray<UIAccessibilityElement *> *elements = [paragraphComponentView accessibilityElements];
  XCTAssert(elements.count == 2, @"Expected 2 accessibilityElements - one for the whole string, and one for the link");
  XCTAssert(
      elements[1].accessibilityTraits & UIAccessibilityTraitLink,
      @"Expected the second accessibilityElement has link trait");
}

- (void)testAccessibilityTruncatedText
{
  ParagraphShadowNode::ConcreteState::Shared _state = stateWithShadowNode(ParagrahShadowNodeC_);
  ABI43_0_0RCTParagraphComponentView *paragraphComponentView = [[ABI43_0_0RCTParagraphComponentView alloc] init];
  [paragraphComponentView updateState:_state oldState:nil];

  NSArray<UIAccessibilityElement *> *elements = [paragraphComponentView accessibilityElements];
  XCTAssert(elements.count == 2, @"Expected 2 accessibilityElements - one for the whole string, and one for the link");
  XCTAssert(
      elements[1].accessibilityTraits & UIAccessibilityTraitLink,
      @"Expected the second accessibilityElement has link trait");
}

@end
