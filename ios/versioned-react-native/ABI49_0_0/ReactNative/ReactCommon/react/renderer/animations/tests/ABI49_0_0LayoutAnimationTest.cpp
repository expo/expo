/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <vector>

#include <glog/logging.h>
#include <gtest/gtest.h>

#include <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>
#include <ABI49_0_0React/renderer/animations/ABI49_0_0LayoutAnimationDriver.h>
#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorProvider.h>
#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorProviderRegistry.h>
#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorRegistry.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewComponentDescriptor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0Differentiator.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowViewMutation.h>

#include <ABI49_0_0React/renderer/mounting/ABI49_0_0stubs.h>
#include <ABI49_0_0React/test_utils/ABI49_0_0Entropy.h>
#include <ABI49_0_0React/test_utils/ABI49_0_0MockClock.h>
#include <ABI49_0_0React/test_utils/ABI49_0_0shadowTreeGeneration.h>

// Uncomment when random test blocks are uncommented below.
// #include <algorithm>
// #include <random>

MockClock::time_point MockClock::time_ = {};

namespace ABI49_0_0facebook::ABI49_0_0React {

static void testShadowNodeTreeLifeCycleLayoutAnimations(
    uint_fast32_t seed,
    int treeSize,
    int repeats,
    int stages,
    int animation_duration,
    int animation_frames,
    int delay_ms_between_frames,
    int delay_ms_between_stages,
    int delay_ms_between_repeats,
    bool commits_conflicting_mutations = false,
    int final_animation_delay = 0) {
  auto entropy = seed == 0 ? Entropy() : Entropy(seed);

  auto eventDispatcher = EventDispatcher::Shared{};
  auto contextContainer = std::make_shared<ContextContainer const>();
  auto componentDescriptorParameters =
      ComponentDescriptorParameters{eventDispatcher, contextContainer, nullptr};
  auto viewComponentDescriptor =
      ViewComponentDescriptor(componentDescriptorParameters);
  auto rootComponentDescriptor =
      RootComponentDescriptor(componentDescriptorParameters);
  auto noopEventEmitter =
      std::make_shared<ViewEventEmitter const>(nullptr, -1, eventDispatcher);

  PropsParserContext parserContext{-1, *contextContainer};

  // Create a RuntimeExecutor
  RuntimeExecutor runtimeExecutor =
      [](std::function<void(jsi::Runtime &)> const & /*unused*/) {};

  // Create component descriptor registry for animation driver
  auto providerRegistry =
      std::make_shared<ComponentDescriptorProviderRegistry>();
  auto componentDescriptorRegistry =
      providerRegistry->createComponentDescriptorRegistry(
          componentDescriptorParameters);
  providerRegistry->add(
      concreteComponentDescriptorProvider<ViewComponentDescriptor>());

  // Create Animation Driver
  auto animationDriver = std::make_shared<LayoutAnimationDriver>(
      runtimeExecutor, contextContainer, nullptr);
  animationDriver->setComponentDescriptorRegistry(componentDescriptorRegistry);

  // Mock animation timers
  animationDriver->setClockNow([]() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
               MockClock::now().time_since_epoch())
        .count();
  });

  auto allNodes = std::vector<ShadowNode::Shared>{};

  for (int i = 0; i < repeats; i++) {
    allNodes.clear();

    int surfaceIdInt = 1;
    auto surfaceId = SurfaceId(surfaceIdInt);

    auto family = rootComponentDescriptor.createFamily(
        {Tag(surfaceIdInt), surfaceId, nullptr}, nullptr);

    // Creating an initial root shadow node.
    auto emptyRootNode = std::const_pointer_cast<RootShadowNode>(
        std::static_pointer_cast<RootShadowNode const>(
            rootComponentDescriptor.createShadowNode(
                ShadowNodeFragment{RootShadowNode::defaultSharedProps()},
                family)));

    // Applying size constraints.
    emptyRootNode = emptyRootNode->clone(
        parserContext,
        LayoutConstraints{
            Size{512, 0}, Size{512, std::numeric_limits<Float>::infinity()}},
        LayoutContext{});

    // Generation of a random tree.
    auto singleRootChildNode =
        generateShadowNodeTree(entropy, viewComponentDescriptor, treeSize);

    // Injecting a tree into the root node.
    auto currentRootNode = std::static_pointer_cast<RootShadowNode const>(
        emptyRootNode->ShadowNode::clone(ShadowNodeFragment{
            ShadowNodeFragment::propsPlaceholder(),
            std::make_shared<ShadowNode::ListOfShared>(
                ShadowNode::ListOfShared{singleRootChildNode})}));

    // Building an initial view hierarchy.
    auto viewTree = buildStubViewTreeWithoutUsingDifferentiator(*emptyRootNode);
    viewTree.mutate(
        calculateShadowViewMutations(*emptyRootNode, *currentRootNode));

    for (int j = 0; j < stages; j++) {
      auto nextRootNode = currentRootNode;

      // Mutating the tree.
      alterShadowTree(
          entropy,
          nextRootNode,
          {
              &messWithChildren,
              &messWithYogaStyles,
              &messWithLayoutableOnlyFlag,
          });

      std::vector<LayoutableShadowNode const *> affectedLayoutableNodes{};
      affectedLayoutableNodes.reserve(1024);

      // Laying out the tree.
      std::const_pointer_cast<RootShadowNode>(nextRootNode)
          ->layoutIfNeeded(&affectedLayoutableNodes);

      nextRootNode->sealRecursive();
      allNodes.push_back(nextRootNode);

      // Calculating mutations.
      auto originalMutations =
          calculateShadowViewMutations(*currentRootNode, *nextRootNode);

      // If tree randomization produced no changes in the form of mutations,
      // don't bother trying to animate because this violates a bunch of our
      // assumptions in this test
      if (originalMutations.empty()) {
        continue;
      }

      // If we only mutated the root... also don't bother
      if (originalMutations.size() == 1 &&
          (originalMutations[0].oldChildShadowView.tag == 1 ||
           originalMutations[0].newChildShadowView.tag == 1)) {
        continue;
      }

      // Configure animation
      animationDriver->uiManagerDidConfigureNextLayoutAnimation(
          {surfaceId,
           0,
           false,
           {(double)animation_duration,
            {/* Create */ AnimationType::EaseInEaseOut,
             AnimationProperty::Opacity,
             (double)animation_duration,
             0,
             0,
             0},
            {/* Update */ AnimationType::EaseInEaseOut,
             AnimationProperty::ScaleXY,
             (double)animation_duration,
             0,
             0,
             0},
            {/* Delete */ AnimationType::EaseInEaseOut,
             AnimationProperty::Opacity,
             (double)animation_duration,
             0,
             0,
             0}},
           {},
           {},
           {}});

      // Get mutations for each frame
      for (int k = 0; k < animation_frames + 2; k++) {
        auto mutationsInput = ShadowViewMutation::List{};
        if (k == 0) {
          mutationsInput = originalMutations;
        }

        if (k != (animation_frames + 1)) {
          ABI49_0_0EXPECT_TRUE(animationDriver->shouldOverridePullTransaction());
        } else if (!commits_conflicting_mutations) {
          ABI49_0_0EXPECT_FALSE(animationDriver->shouldOverridePullTransaction());
        }

        auto telemetry = TransactionTelemetry{};
        telemetry.willLayout();
        telemetry.willCommit();
        telemetry.willDiff();

        auto transaction = animationDriver->pullTransaction(
            surfaceId, 0, telemetry, mutationsInput);

        ABI49_0_0EXPECT_TRUE(transaction.has_value() || k == animation_frames);

        // We have something to validate.
        if (transaction.has_value()) {
          auto mutations = transaction->getMutations();

          // Mutating the view tree.
          viewTree.mutate(mutations);

          // We don't do any validation on this until all animations are
          // finished!
        }

        MockClock::advance_by(
            std::chrono::milliseconds(delay_ms_between_frames));
      }

      // After the animation is completed...
      // Build a view tree to compare with.
      // After all the synthetic mutations, at the end of the animation,
      // the mutated and newly-constructed trees should be identical.
      if (!commits_conflicting_mutations) {
        auto rebuiltViewTree =
            buildStubViewTreeWithoutUsingDifferentiator(*nextRootNode);

        // Comparing the newly built tree with the updated one.
        if (rebuiltViewTree != viewTree) {
          // Something went wrong.

          LOG(ERROR)
              << "Entropy seed: " << entropy.getSeed()
              << ". To see why trees are different, define STUB_VIEW_TREE_VERBOSE and see logging in StubViewTree.cpp.\n";

          ABI49_0_0EXPECT_TRUE(false);
        }
      }

      currentRootNode = nextRootNode;

      MockClock::advance_by(std::chrono::milliseconds(delay_ms_between_stages));
    }

    // Flush all remaining animations before validating trees
    if (final_animation_delay > 0) {
      MockClock::advance_by(std::chrono::milliseconds(final_animation_delay));

      auto telemetry = TransactionTelemetry{};
      telemetry.willLayout();
      telemetry.willCommit();
      telemetry.willDiff();

      auto transaction =
          animationDriver->pullTransaction(surfaceId, 0, telemetry, {});
      // We have something to validate.
      if (transaction.has_value()) {
        auto mutations = transaction->getMutations();

        // Mutating the view tree.
        viewTree.mutate(mutations);

        // We don't do any validation on this until all animations are
        // finished!
      }
    }

    // After all animations are completed...
    // Build a view tree to compare with.
    // After all the synthetic mutations, at the end of the animation,
    // the mutated and newly-constructed trees should be identical.
    if (commits_conflicting_mutations) {
      auto rebuiltViewTree =
          buildStubViewTreeWithoutUsingDifferentiator(*currentRootNode);

      // Comparing the newly built tree with the updated one.
      if (rebuiltViewTree != viewTree) {
        // Something went wrong.

        LOG(ERROR)
            << "Entropy seed: " << entropy.getSeed()
            << ". To see why trees are different, define STUB_VIEW_TREE_VERBOSE and see logging in StubViewTree.cpp.\n";

        ABI49_0_0EXPECT_TRUE(false);
      }
    }

    MockClock::advance_by(std::chrono::milliseconds(delay_ms_between_repeats));
  }

  SUCCEED();
}

} // namespace ABI49_0_0facebook::ABI49_0_0React

using namespace ABI49_0_0facebook::ABI49_0_0React;

TEST(
    LayoutAnimationTest,
    stableSmallerTreeFewRepeatsFewStages_NonOverlapping_2029343357) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 2029343357, /* working seed found 5-10-2021 */
      /* size */ 128,
      /* repeats */ 128,
      /* stages */ 10,
      /* animation_duration */ 1000,
      /* animation_frames*/ 10,
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000);
}

TEST(
    LayoutAnimationTest,
    stableSmallerTreeFewRepeatsFewStages_NonOverlapping_3619914559) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 3619914559, /* working seed found 5-10-2021 */
      /* size */ 128,
      /* repeats */ 128,
      /* stages */ 10,
      /* animation_duration */ 1000,
      /* animation_frames*/ 10,
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000);
}

TEST(
    LayoutAnimationTest,
    stableSmallerTreeFewRepeatsFewStages_NonOverlapping_597132284) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 597132284, /* failing seed found 5-10-2021 */
      /* size */ 128,
      /* repeats */ 128,
      /* stages */ 10,
      /* animation_duration */ 1000,
      /* animation_frames*/ 10,
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000);
}

TEST(
    LayoutAnimationTest,
    stableSmallerTreeFewRepeatsFewStages_NonOverlapping_774986518) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 774986518, /* failing seed found 5-10-2021 */
      /* size */ 128,
      /* repeats */ 128,
      /* stages */ 10,
      /* animation_duration */ 1000,
      /* animation_frames*/ 10,
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000);
}

TEST(
    LayoutAnimationTest,
    stableSmallerTreeFewRepeatsFewStages_NonOverlapping_1450614414) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 1450614414, /* failing seed found 5-10-2021 */
      /* size */ 128,
      /* repeats */ 128,
      /* stages */ 10,
      /* animation_duration */ 1000,
      /* animation_frames*/ 10,
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000);
}

TEST(LayoutAnimationTest, stableBiggerTreeFewRepeatsFewStages_NonOverlapping) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 2029343357,
      /* size */ 512,
      /* repeats */ 32,
      /* stages */ 10,
      /* animation_duration */ 1000,
      /* animation_frames*/ 10,
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000);
}

TEST(LayoutAnimationTest, stableBiggerTreeFewRepeatsManyStages_NonOverlapping) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 2029343357,
      /* size */ 512,
      /* repeats */ 32,
      /* stages */ 128,
      /* animation_duration */ 1000,
      /* animation_frames*/ 10,
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000);
}

// You may uncomment this - locally only! - to generate failing seeds.
// TEST(LayoutAnimationTest, stableSmallerTreeFewRepeatsFewStages_Random) {
//   std::random_device device;
//   for (int i = 0; i < 10; i++) {
//     uint_fast32_t seed = device();
//     LOG(ERROR) << "Seed: " << seed;
//     testShadowNodeTreeLifeCycleLayoutAnimations(
//         /* seed */ seed,
//         /* size */ 128,
//         /* repeats */ 128,
//         /* stages */ 10,
//         /* animation_duration */ 1000,
//         /* animation_frames*/ 10,
//         /* delay_ms_between_frames */ 100,
//         /* delay_ms_between_stages */ 100,
//         /* delay_ms_between_repeats */ 2000);
//   }
//   // Fail if you want output to get seeds
//   LOG(ERROR) << "ALL RUNS SUCCESSFUL";
//   // ABI49_0_0React_native_assert(false);
// }

//
// These tests are "overlapping", meaning that mutations will be committed
// before the previous animation completes.
//

TEST(
    LayoutAnimationTest,
    stableSmallerTreeFewRepeatsFewStages_Overlapping_2029343357) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 2029343357,
      /* size */ 128,
      /* repeats */ 128,
      /* stages */ 10,
      /* animation_duration */ 1000,
      /* animation_frames*/ 9, // an animation completes in 10 frames, so this
                               // causes conflicts
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000,
      /* commits_conflicting_mutations */ true,
      /* final_animation_delay */ 10000 + 1);
}

TEST(
    LayoutAnimationTest,
    stableSmallerTreeFewRepeatsFewStages_Overlapping_597132284) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 597132284,
      /* size */ 128,
      /* repeats */ 128,
      /* stages */ 10,
      /* animation_duration */ 1000,
      /* animation_frames*/ 9, // an animation completes in 10 frames, so this
                               // causes conflicts
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000,
      /* commits_conflicting_mutations */ true,
      /* final_animation_delay */ 10000 + 1);
}

TEST(
    LayoutAnimationTest,
    stableSmallerTreeFewRepeatsFewStages_Overlapping_ManyConflicts_597132284) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 597132284,
      /* size */ 128,
      /* repeats */ 128,
      /* stages */ 50,
      /* animation_duration */ 1000,
      /* animation_frames*/ 5, // an animation completes in 10 frames, so this
                               // causes conflicts. We only animate 5 frames,
                               // but have 50 stages, so conflicts stack up
                               // quickly.
      /* delay_ms_between_frames */ 100,
      /* delay_ms_between_stages */ 100,
      /* delay_ms_between_repeats */ 2000,
      /* commits_conflicting_mutations */ true,
      /* final_animation_delay */ 50000 + 1);
}

TEST(
    LayoutAnimationTest,
    stableBiggerTreeFewRepeatsManyStages_Overlapping_ManyConflicts_2029343357) {
  testShadowNodeTreeLifeCycleLayoutAnimations(
      /* seed */ 2029343357,
      /* size */ 512,
      /* repeats */ 32,
      /* stages */ 128,
      /* animation_duration */ 1000,
      /* animation_frames*/ 10,
      /* delay_ms_between_frames */ 10,
      /* delay_ms_between_stages */ 10,
      /* delay_ms_between_repeats */ 2000,
      /* commits_conflicting_mutations */ true,
      /* final_animation_delay */ (128 * 1000 + 100));
}

// You may uncomment this -
//     locally only !-to generate failing seeds.
// TEST(
//     LayoutAnimationTest,
//     stableSmallerTreeFewRepeatsFewStages_Overlapping_Random) {
//   std::random_device device;
//   for (int i = 0; i < 10; i++) {
//     uint_fast32_t seed = device();
//     LOG(ERROR) << "Seed: " << seed;
//     testShadowNodeTreeLifeCycleLayoutAnimations(
//         /* seed */ seed,
//         /* size */ 512,
//         /* repeats */ 32,
//         /* stages */ 128,
//         /* animation_duration */ 1000,
//         /* animation_frames*/ 10,
//         /* delay_ms_between_frames */ 10,
//         /* delay_ms_between_stages */ 10,
//         /* delay_ms_between_repeats */ 2000,
//         /* commits_conflicting_mutations */ true,
//         /* final_animation_delay */ (128 * 1000 + 100));
//   }
//   // Fail if you want output to get seeds
//   LOG(ERROR) << "ALL RUNS SUCCESSFUL";
//   // ABI49_0_0React_native_assert(false);
// }
