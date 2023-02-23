//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayContainerSheetDismissalPolicy.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 07/04/2020.
//

import UIKit

/// A protocol that provides contextual information on the drag-to-dismiss gesture state.
public protocol OverlayContainerSheetDismissalPolicyContext: OverlayContainerTransitionContext {
    /// The expected translation height once the animation ended.
    var targetTranslationHeight: CGFloat { get }
}

/// A protocol that defines the dismissal policy associated to an overlay container sheet controller.
public protocol OverlayContainerSheetDismissalPolicy {
    /// Asks the policy if the presented view controller should be dismissed when a drag-to-dismiss gesture happens.
    ///
    /// - parameter context: The context object containing information about the current overlay container state.
    ///
    /// - returns: `true` if the presented view controller should be dismissed or `false` if it should not.
    func shouldDismiss(using context: OverlayContainerSheetDismissalPolicyContext) -> Bool
}

/// The policy used by the sheet presentation controller by default.
public struct ThresholdOverlayContainerSheetDismissalPolicy: OverlayContainerSheetDismissalPolicy {

    /// `Position` defines a position that can dismiss the overlay container.
    public enum Position {
        /// The policy ignores the overlay translation height
        case none
        /// If the overlay goes under the specified notch, the policy dismisses it.
        case notch(index: Int)
        /// If the overlay goes under the specified translation height, the policy dismisses it.
        case translationHeight(CGFloat)
    }

    /// `Velocity` defines a velocity that can dismiss the overlay container.
    public enum Velocity {
        /// The policy ignores the overlay translation velocity
        case none
        /// If the overlay goes faster than the specified value, the policy dismisses the container.
        case value(CGFloat)
    }

    /// A velocity that can trigger a dismissal.
    public var dismissingVelocity: Velocity

    /// A position that can trigger a dismissal.
    public var dismissingPosition: Position

    // MARK: - Life Cycle

    /// Creates a `ThresholdOverlayContainerSheetDismissalPolicy` instance.
    ///
    /// - parameter dismissingVelocity: A velocity that can trigger a dismissal. The default value is `2400.0` pts/s.
    /// - parameter dismissingPosition: A position that can trigger a dismissal. The default value is the first container notch.
    ///
    /// - returns: The new`ThresholdOverlayContainerSheetDismissalPolicy` instance.
    public init(dismissingVelocity: Velocity = .value(2400.0),
                dismissingPosition: Position = .notch(index: 0)) {
        self.dismissingVelocity = dismissingVelocity
        self.dismissingPosition = dismissingPosition
    }

    // MARK: - OverlayContainerDimissingPolicy

    public func shouldDismiss(using context: OverlayContainerSheetDismissalPolicyContext) -> Bool {
        guard !context.isDragging else { return false  }
        let translationHeight = context.targetTranslationHeight
        switch dismissingPosition {
        case .none:
            break
        case let .notch(index):
            if translationHeight < context.height(forNotchAt: index) {
                return true
            }
        case let .translationHeight(height):
            if translationHeight < height {
                return true
            }
        }
        switch dismissingVelocity {
        case .none:
            return false
        case let .value(value):
            return context.velocity.y > value
        }
    }
}
