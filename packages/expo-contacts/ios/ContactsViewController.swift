import UIKit
import ContactsUI

class ContactsViewController: CNContactViewController {
  var onViewDisappeared: (() -> Void)?

  func setCloseButton(title: String) {
    if self.navigationItem.leftBarButtonItem == nil {
      self.navigationItem.leftBarButtonItem = UIBarButtonItem(title: title, style: .plain, target: self, action: #selector(closeController))
    } else {
      self.navigationItem.leftBarButtonItem?.title = title
    }
  }

  @objc func closeController() {
    dismiss(animated: true)
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    onViewDisappeared?()
  }
}
