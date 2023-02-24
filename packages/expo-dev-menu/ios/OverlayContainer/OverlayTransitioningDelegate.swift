//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayTransitioningDelegate.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 14/11/2018.
//

import UIKit

/// A protocol that provides contextual information on the current overlay translation.
///
/// Do not adopt this protocol in your own classes, use the one provided in `OverlayTranslationTargetNotchPolicy`.
public protocol OverlayContainerContextTargetNotchPolicy: OverlayContainerTransitionContext {
    /// The manipulated child view controller.
    var overlayViewController: UIViewController { get }
}

/// A protocol that provides contextual information on the current overlay translation.
///
/// Do not adopt this protocol in your own classes, use the one provided in `OverlayAnimatedTransitioning`.
public protocol OverlayContainerContextTransitioning: OverlayContainerTransitionContext {
    /// The manipulated child view controller.
    var overlayViewController: UIViewController { get }
    /// The expected notch index once the animations ended.
    var targetNotchIndex: Int { get }
    /// The expected translation height once the animation ended.
    var targetNotchHeight: CGFloat { get }
}

/// A protocol that manages the container behavior once the user finishes dragging.
///
/// Adopt this protocol to provide your own translation behavior.
public protocol OverlayTransitioningDelegate: AnyObject {
    /// Returns the target notch policy for the specified child view controller.
    func overlayTargetNotchPolicy(for overlayViewController: UIViewController) -> OverlayTranslationTargetNotchPolicy?
    /// Returns the animation controller for the specified child view controller.
    func animationController(for overlayViewController: UIViewController) -> OverlayAnimatedTransitioning?
}

/// A protocol that provides the expected notch index once the user finishes dragging.
///
/// Adopt this protocol to provide your own policy. You can also use the provided
/// implementations like `RushingForwardTargetNotchPolicy`.
public protocol OverlayTranslationTargetNotchPolicy {
    /// Returns the expected notch index based on the specified context.
    func targetNotchIndex(using context: OverlayContainerContextTargetNotchPolicy) -> Int
}

/// A protocol that provides the animation controllers once the user finishes dragging.
///
/// Adopt this protocol to perform your own translation animations. You can also use the provided
/// implementations like `SpringOverlayTranslationAnimationController`.
public protocol OverlayAnimatedTransitioning {
    /// Returns the animator that will animate the end of the translation.
    func interruptibleAnimator(using context: OverlayContainerContextTransitioning) -> UIViewImplicitlyAnimating
}

public extension OverlayTransitioningDelegate {

    func overlayTargetNotchPolicy(for overlayViewController: UIViewController) -> OverlayTranslationTargetNotchPolicy? {
        nil
    }

    func animationController(for overlayViewController: UIViewController) -> OverlayAnimatedTransitioning? {
        nil
    }
}
