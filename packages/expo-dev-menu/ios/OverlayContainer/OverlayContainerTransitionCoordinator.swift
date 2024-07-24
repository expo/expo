//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayAnimationCoordinator.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 14/11/2018.
//

import UIKit

/// A protocol that provides information about the current overlay translation.
public protocol OverlayContainerTransitionContext {
    /// A Boolean value that indicates whether the user is currently dragging the overlay.
    var isDragging: Bool { get }
    /// The overlay velocity.
    var velocity: CGPoint { get }
    /// The current translation height.
    var overlayTranslationHeight: CGFloat { get }
    /// The notch indexes.
    var notchIndexes: Range<Int> { get }
    /// The reachable indexes. Some indexes might be disabled by the `canReachNotchAt` delegate method.
    var reachableIndexes: [Int] { get }
    /// Returns the height of the specified notch.
    func height(forNotchAt index: Int) -> CGFloat
}

public extension OverlayContainerTransitionContext {

    func minimumReachableHeight() -> CGFloat {
        return reachableIndexes.first.flatMap { height(forNotchAt: $0) } ?? 0
    }

    func maximumReachableHeight() -> CGFloat {
        return reachableIndexes.last.flatMap { height(forNotchAt: $0) } ?? 0
    }

    func minimumHeight() -> CGFloat {
        return notchIndexes.first.flatMap { height(forNotchAt: $0) } ?? 0
    }

    func maximumHeight() -> CGFloat {
        return notchIndexes.last.flatMap { height(forNotchAt: $0) } ?? 0
    }
}


/// A protocol that provides information about an in-progress translation.
/// Do not adopt this protocol in your own classes. Use the one provided by the `OverlayContainerTransitionCoordinator`.
public protocol OverlayContainerTransitionCoordinatorContext: OverlayContainerTransitionContext {
    /// A Boolean value indicating whether the transition is explicitly animated.
    var isAnimated: Bool { get }
    /// A Boolean value indicating whether the transition was cancelled.
    var isCancelled: Bool { get }
    /// The overlay height the container expects to reach.
    var targetTranslationHeight: CGFloat { get }
}

/// A protocol that provides support for animations associated with an overlay translation.
///
/// Do not adopt this procotol in your own classes. Use the one provided by the `OverlayContainerDelegate` to
/// add any extra animations alongside the translation animations.
public protocol OverlayContainerTransitionCoordinator: OverlayContainerTransitionCoordinatorContext {
    /// Runs the specified animations at the same time as overlay translation end animations.
    func animate(alongsideTransition animation: ((OverlayContainerTransitionCoordinatorContext) -> Void)?,
                 completion: ((OverlayContainerTransitionCoordinatorContext) -> Void)?)
}

public extension OverlayContainerTransitionCoordinatorContext {

    func translationProgress() -> CGFloat {
        let maximum = maximumReachableHeight()
        let minimum = minimumReachableHeight()
        return maximum != minimum ? (targetTranslationHeight - minimum) / (maximum - minimum) : 0
    }

    func overallTranslationProgress() -> CGFloat {
        let maximum = maximumHeight()
        let minimum = minimumHeight()
        return maximum != minimum ? (targetTranslationHeight - minimum) / (maximum - minimum) : 0
    }
}
