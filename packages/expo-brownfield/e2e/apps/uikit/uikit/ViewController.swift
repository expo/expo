//
//  ViewController.swift
//  uikit
//
//  Created by Patryk Mleczek on 1/9/26.
//

import UIKit

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = .systemBackground
        
        let label = UILabel()
        label.text = "Hello UIKit!"
        label.textColor = .label
        label.font = .systemFont(ofSize: 30, weight: .bold)
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        
        NSLayoutConstraint.activate([
          label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
          label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }
}
