//  Copyright (c) 2018, Applidium. All rights reserved
//  RushingForwardTargetNotchPolicy.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 27/11/2018.
//

import UIKit

private struct Constant {
    static let minimumDuration: CGFloat = 0.1
    static let minimumVelocity: CGFloat = 400
}

/// `RushingForwardTargetNotchPolicy` specifies a policy that will always move forward if a
/// minimum velocity has been reached.
public class RushingForwardTargetNotchPolicy: OverlayTranslationTargetNotchPolicy {

    /// The minimum velocity to reach to move forward. The default value is 400 pt/s.
    public var minimumVelocity: CGFloat = Constant.minimumVelocity
    /// The minimum duration defines the minimum translation duration to expect.
    public var minimumDuration: CGFloat = Constant.minimumDuration

    // MARK: - Life Cycle

    public init() {}

    // MARK: - OverlayTranslationTargetNotchPolicy

    public func targetNotchIndex(using context: OverlayContainerContextTargetNotchPolicy) -> Int {
        guard !context.reachableIndexes.isEmpty else { return 0 }
        let height = minimumDuration * -context.velocity.y + context.overlayTranslationHeight
        let closestNotches = context.reachableIndexes.sorted {
            let lhsHeight = context.height(forNotchAt: $0)
            let rhsHeight = context.height(forNotchAt: $1)
            let lhsDistance = abs(height - lhsHeight)
            let rhsDistance = abs(height - rhsHeight)
            return (lhsDistance, lhsHeight) < (rhsDistance, rhsHeight)
        }
        if context.reachableIndexes.count > 1 && abs(context.velocity.y) > minimumVelocity {
            let lhs = closestNotches[0]
            let rhs = closestNotches[1]
            if context.velocity.y < 0 {
                return max(lhs, rhs)
            } else {
                return min(lhs, rhs)
            }
        } else {
            return closestNotches.first ?? 0
        }
    }
}
