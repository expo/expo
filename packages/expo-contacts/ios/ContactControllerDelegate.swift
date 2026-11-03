import ContactsUI

class ContactControllerDelegate: NSObject, CNContactViewControllerDelegate {
  var onComplete: ((CNContact?) -> Void)?

  func contactViewController(_ viewController: CNContactViewController, didCompleteWith contact: CNContact?) {
    onComplete?(contact)
    viewController.dismiss(animated: true)
  }
}
