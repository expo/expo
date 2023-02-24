//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayContainerViewControllerDelegateWrapper.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 20/11/2018.
//

import UIKit

class OverlayContainerConfigurationImplementation: OverlayContainerConfigurationInvalidating {

    private weak var overlayContainerViewController: OverlayContainerViewController?

    weak var delegate: OverlayContainerViewControllerDelegate?

    private(set) var notchHeightByIndex: [Int: CGFloat] = [:]

    private var needsMetricUpdate = false

    // MARK: - Life Cycle

    init(overlayContainerViewController: OverlayContainerViewController) {
        self.overlayContainerViewController = overlayContainerViewController
    }

    // MARK: - OverlayContainerConfigurationInvalidating

    func invalidateOverlayMetrics() {
        needsMetricUpdate = true
    }

    func requestOverlayMetricsIfNeeded() {
        guard needsMetricUpdate else { return }
        needsMetricUpdate = false
        let numberOfNotches = requestNumberOfNotches()
        assert(numberOfNotches >= 0, "The number of notches must be positive.")
        let heights = (0..<numberOfNotches).map { requestHeightForNotch(at: $0) }
        assert(heights.sorted() == heights, "The notches should be sorted by height. The notch at the first index must be the smaller one. \(heights)")
        let values = heights.enumerated().map { ($0, $1) }
        notchHeightByIndex = Dictionary(uniqueKeysWithValues: values)
    }

    // MARK: - OverlayContainerViewControllerConfiguration

    func numberOfNotches() -> Int {
        return notchHeightByIndex.count
    }

    func heightForNotch(at index: Int) -> CGFloat {
        return notchHeightByIndex[index] ?? 0
    }

    func animationController(forOverlay overlay: UIViewController) -> OverlayAnimatedTransitioning {
        guard let controller = overlayContainerViewController else {
            return SpringOverlayTranslationAnimationController()
        }
        let transitioningDelegate = delegate?.overlayContainerViewController(
            controller,
            transitioningDelegateForOverlay: overlay
        )
        let defaultController = SpringOverlayTranslationAnimationController(style: controller.style)
        return transitioningDelegate?.animationController(for: overlay) ?? defaultController
    }

    func overlayTargetNotchPolicy(forOverlay overlay: UIViewController) -> OverlayTranslationTargetNotchPolicy {
        guard let controller = overlayContainerViewController else {
            return RushingForwardTargetNotchPolicy()
        }
        let transitioningDelegate = delegate?.overlayContainerViewController(
            controller,
            transitioningDelegateForOverlay: overlay
        )
        return transitioningDelegate?.overlayTargetNotchPolicy(for: overlay) ?? RushingForwardTargetNotchPolicy()
    }

    func scrollView(drivingOverlay controller: UIViewController) -> UIScrollView? {
        guard let containerController = overlayContainerViewController else { return nil }
        return delegate?.overlayContainerViewController(containerController, scrollViewDrivingOverlay: controller)
    }

    func shouldStartDraggingOverlay(_ viewController: UIViewController,
                                    at point: CGPoint,
                                    in coordinateSpace: UICoordinateSpace) -> Bool {
        guard let containerController = overlayContainerViewController else { return false }
        return delegate?.overlayContainerViewController(
            containerController,
            shouldStartDraggingOverlay: viewController,
            at: point,
            in: coordinateSpace
        ) ?? true
    }

    func overlayTranslationFunction(using context: OverlayTranslationParameters,
                                    for overlayViewController: UIViewController) -> OverlayTranslationFunction {
        guard let containerController = overlayContainerViewController else {
            return RubberBandOverlayTranslationFunction()
        }
        return delegate?.overlayContainerViewController(
            containerController,
            overlayTranslationFunctionForOverlay: overlayViewController
        ) ?? RubberBandOverlayTranslationFunction()
    }

    func canReachNotch(at index: Int, for overlayViewController: UIViewController) -> Bool {
        guard let containerController = overlayContainerViewController else {
            return true
        }
        return delegate?.overlayContainerViewController(
            containerController,
            canReachNotchAt: index,
            forOverlay: overlayViewController
        ) ?? true
    }

    // MARK: - Private

    private func requestHeightForNotch(at index: Int) -> CGFloat {
        guard let controller = overlayContainerViewController else { return 0 }
        return delegate?.overlayContainerViewController(
            controller,
            heightForNotchAt: index,
            availableSpace: controller.availableSpace
        ) ?? 0
    }

    private func requestNumberOfNotches() -> Int {
        guard let controller = overlayContainerViewController else { return 0 }
        return delegate?.numberOfNotches(in: controller) ?? 0
    }
}
