// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/ExpoViewTraits.h>
#import <react/renderer/core/ShadowNodeTraits.h>

/**
 Declares what expo-image's view *is* to react-native's layout: an inline
 replaced element. The traits — not the component name — are what layout
 checks, so this is the entire wiring that lets an `<img>` element backed by
 this view flow inside a line of text, positioned by the owning view's
 attachment-layout pass and never blockified.

 A load-time initializer so the declaration exists before the first render.
 Eventually this belongs in the module definition DSL (a `View` trait
 modifier); a C++ TU is the proof-of-concept shape.
 */
__attribute__((constructor)) static void EXImageDeclareViewTraits(void)
{
  auto traits = facebook::react::ShadowNodeTraits{};
  // Its size is its own (the image's), not derived from children: a leaf to Yoga.
  traits.set(facebook::react::ShadowNodeTraits::Trait::LeafYogaNode);
  // Participates in a text run…
  traits.set(facebook::react::ShadowNodeTraits::Trait::InlineText);
  // …as a replaced element: an attachment in the line, never blockified.
  traits.set(facebook::react::ShadowNodeTraits::Trait::InlineReplaced);
  expo::ExpoViewTraits::declare("ViewManagerAdapter_ExpoImage", traits);
}
