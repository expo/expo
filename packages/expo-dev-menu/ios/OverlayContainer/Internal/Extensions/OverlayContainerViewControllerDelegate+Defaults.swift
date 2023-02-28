//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayContainerViewControllerDelegate+Defaults.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 23/11/2018.
//

import UIKit

public extension OverlayContainerViewControllerDelegate {
    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        transitioningDelegateForOverlay overlayViewController: UIViewController) -> OverlayTransitioningDelegate? {
        return nil
    }

    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        scrollViewDrivingOverlay overlayViewController: UIViewController) -> UIScrollView? {
        return nil
    }

    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        shouldStartDraggingOverlay overlayViewController: UIViewController,
                                        at point: CGPoint,
                                        in coordinateSpace: UICoordinateSpace) -> Bool {
        let convertedPoint = coordinateSpace.convert(point, to: overlayViewController.view)
        return overlayViewController.view.bounds.contains(convertedPoint)
    }

    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        overlayTranslationFunctionForOverlay overlayViewController: UIViewController) -> OverlayTranslationFunction? {
        return nil
    }

    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        willMoveOverlay overlayViewController: UIViewController,
                                        toNotchAt index: Int) {}

    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        didMoveOverlay overlayViewController: UIViewController,
                                        toNotchAt index: Int) {}

    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        willStartDraggingOverlay overlayViewController: UIViewController) {}

    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        willEndDraggingOverlay overlayViewController: UIViewController,
                                        atVelocity velocity: CGPoint) {}

    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        willTranslateOverlay overlayViewController: UIViewController,
                                        transitionCoordinator: OverlayContainerTransitionCoordinator) {}

    func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                        canReachNotchAt index: Int,
                                        forOverlay overlayViewController: UIViewController) -> Bool {
        return true
    }
}
