//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayContainerSheetPresentationControllerDelegate.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 08/04/2020.
//

import UIKit

/// The presentation controller delegate is responsible for defining the aspect and the behavior of the controller.
public protocol OverlayContainerSheetPresentationControllerDelegate: AnyObject {

    /// Asks the delegate for the dismissal policy associated to the specified presentation controller.
    ///
    /// The default implementation of this method returns a `ThresholdOverlayContainerSheetDismissalPolicy` instance.
    ///
    /// - parameter presentationController: The presentation controller requesting this information.
    func overlayContainerSheetDismissalPolicy(for presentationController: OverlayContainerSheetPresentationController) -> OverlayContainerSheetDismissalPolicy

    /// Asks the delegate if the presentation controller should dismiss the presented containers when a touch occured in the presentation container view.
    ///
    /// The default implementation of this method returns `true`.
    ///
    /// - parameter presentationController: The presentation controller requesting this information.
    func overlayContainerSheetPresentationControllerShouldDismissOnTap(_ presentationController: OverlayContainerSheetPresentationController) -> Bool
}
