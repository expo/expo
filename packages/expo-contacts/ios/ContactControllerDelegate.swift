import ContactsUI

class ContactControllerDelegate: NSObject, CNContactViewControllerDelegate {
  func contactViewController(_ viewController: CNContactViewController, didCompleteWith contact: CNContact?) {
    viewController.dismiss(animated: true)
  }
}
