//  Copyright (c) 2018, Applidium. All rights reserved
//  PassThroughView.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 14/11/2018.
//

import UIKit

/// A view which removes itself from the responder chain.
///
/// Use `PassThroughView` whenever you need to provide a backdrop view to an `OverlayContainerViewController`.
open class PassThroughView: UIView {

    // MARK: - UIView

    open override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let view = super.hitTest(point, with: event)
        if view == self {
            return nil
        }
        return view
    }
}
