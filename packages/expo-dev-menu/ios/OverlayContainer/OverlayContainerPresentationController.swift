//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayContainerPresentationController.swift
//  
//
//  Created by Gaétan Zanella on 07/04/2020.
//

import UIKit

/// An abstract class that can be used to manage the transition animations and the presentation of overlay containers onscreen.
///
/// Any overlay containers currently in the presented view controller hierarchy will be coupled with it.
/// It lets you add custom presentation behaviors based on the current state of the presented overlay containers.
///
/// This class is meant to be subclassed. Before you consider subclassing, though, you should look at
/// the `OverlayContainerSheetPresentationController` class to see if it can be adapted to your presentation behavior.
open class OverlayContainerPresentationController: UIPresentationController {

    // MARK: - Internal

    open override func presentationTransitionWillBegin() {
        super.presentationTransitionWillBegin()
        findPresentedContainers().forEach { $0.overlayContainerPresentationTransitionWillBegin() }
    }

    open override func dismissalTransitionDidEnd(_ completed: Bool) {
        super.dismissalTransitionDidEnd(completed)
        findPresentedContainers().forEach { $0.overlayContainerDismissalTransitionDidEnd() }
    }

    // MARK: - Public

    /// Tells the presentation controller when the user is about to start dragging the overlay view controller.
    ///
    /// - parameter containerViewController: The container requesting this information.
    /// - parameter overlayViewController: The overlay view controller.
    open func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                             willStartDraggingOverlay overlayViewController: UIViewController) {}

    /// Tells the presentation controller when the user finishs dragging the overlay view controller with the specified velocity.
    ///
    /// - parameter containerViewController: The container requesting this information.
    /// - parameter overlayViewController: The overlay view controller.
    /// - parameter velocity: The overlay velocity at the moment the touch was released.
    open func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                             willEndDraggingOverlay overlayViewController: UIViewController,
                                             atVelocity velocity: CGPoint) {}

    /// Tells the presentation controller when the container is about to move the overlay view controller to the specified notch.
    ///
    /// In some cases, the overlay view controller may not successfully reach the specified notch.
    /// If the user cancels the translation for instance. Use `overlayContainerViewController(_:didMove:toNotchAt:)`
    /// if you need to be notified each time the translation succeeds.
    ///
    /// - parameter containerViewController: The container requesting this information.
    /// - parameter overlayViewController: The overlay view controller.
    /// - parameter index: The notch index the overlay view controller is about to reach.
    open func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                             willMoveOverlay overlayViewController: UIViewController,
                                             toNotchAt index: Int) {}

    /// Tells the presentation controller when the container has moved the overlay view controller to the specified notch.
    ///
    /// - parameter containerViewController: The container requesting this information.
    /// - parameter overlayViewController: The overlay view controller.
    /// - parameter index: The notch index the overlay view controller has reached.
    open func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                             didMoveOverlay overlayViewController: UIViewController,
                                             toNotchAt index: Int) {}

    /// Tells the presentation controller whenever the overlay view controller is about to be translated.
    ///
    /// The delegate typically implements this method to coordinate presentation changes alongside
    /// the overlay view controller translation.
    ///
    /// - parameter containerViewController: The container requesting this information.
    /// - parameter overlayViewController: The overlay view controller.
    /// - parameter transitionCoordinator: The transition coordinator object associated with the translation.
    open func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                             willTranslateOverlay overlayViewController: UIViewController,
                                             transitionCoordinator: OverlayContainerTransitionCoordinator) {}

    // MARK: - Private

    private func findPresentedContainers() -> [OverlayContainerViewController] {
        presentedViewController.oc_findChildren(OverlayContainerViewController.self)
    }
}
