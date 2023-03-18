//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayContainerViewControllerDelegateWrapper.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 20/11/2018.
//

import UIKit

protocol OverlayContainerConfiguration {

    func numberOfNotches() -> Int
    func heightForNotch(at index: Int) -> CGFloat

    func canReachNotch(at index: Int, for overlayViewController: UIViewController) -> Bool
    func animationController(forOverlay overlay: UIViewController) -> OverlayAnimatedTransitioning
    func overlayTargetNotchPolicy(forOverlay overlay: UIViewController) -> OverlayTranslationTargetNotchPolicy

    func scrollView(drivingOverlay controller: UIViewController) -> UIScrollView?

    func shouldStartDraggingOverlay(_ viewController: UIViewController,
                                    at point: CGPoint,
                                    in coordinateSpace: UICoordinateSpace) -> Bool
    func overlayTranslationFunction(using context: OverlayTranslationParameters,
                                    for overlayViewController: UIViewController) -> OverlayTranslationFunction
}

protocol OverlayContainerConfigurationInvalidating: OverlayContainerConfiguration {
    func invalidateOverlayMetrics()
    func requestOverlayMetricsIfNeeded()
}

extension OverlayContainerConfiguration {
    var maximumNotchIndex: Int {
        return  max(numberOfNotches() - 1, 0)
    }

    var minimumNotchIndex: Int {
        return 0
    }

    var maximumNotchHeight: CGFloat {
        return heightForNotch(at: maximumNotchIndex)
    }

    var minimumNotchHeight: CGFloat {
        return heightForNotch(at: minimumNotchIndex)
    }

    var notchHeightByIndex: [Int: CGFloat] {
        return Dictionary(
            uniqueKeysWithValues: (0..<numberOfNotches()).map { ($0, heightForNotch(at: $0)) }
        )
    }

    func sortedHeights() -> [CGFloat] {
        return Array(notchHeightByIndex.values.sorted())
    }

    func enabledNotchIndexes(for overlayContainer: UIViewController) -> [Int] {
        return (0..<numberOfNotches()).filter { canReachNotch(at: $0, for: overlayContainer) }
    }
}
