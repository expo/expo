//  Copyright (c) 2018, Applidium. All rights reserved
//  UIViewController+Children.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 19/11/2018.
//

import UIKit

extension UIViewController {
    func addChild(_ child: UIViewController, in containerView: UIView) {
        guard containerView.isDescendant(of: view) else { return }
        addChild(child)
        containerView.addSubview(child.view)
        child.view.pinToSuperview()
        child.didMove(toParent: self)
    }

    func removeChild(_ child: UIViewController) {
        child.willMove(toParent: nil)
        child.view.removeFromSuperview()
        child.removeFromParent()
    }


    func oc_findPresentationController<Controller: UIPresentationController>(_ type: Controller.Type) -> Controller? {
        if let controller = presentationController as? Controller {
            return controller
        }
        return parent?.oc_findPresentationController(Controller.self)
    }

    func oc_findChildren<Controller: UIViewController>(_ type: Controller.Type) -> [Controller] {
        if let controller = self as? Controller {
            return [controller]
        } else {
            return children.map { $0.oc_findChildren(type) }.flatMap { $0 }
        }
    }
}
