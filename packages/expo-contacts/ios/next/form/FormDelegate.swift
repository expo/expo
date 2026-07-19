import ExpoModulesCore
import ContactsUI

class FormDelegate: OnContactPickingResultHandler {
  private let store: CNContactStore
  private let appContext: AppContext?
  private let contactRepository: ContactRepository
  private let groupRepository: GroupRepository
  private let contactFactory: ContactFactory

  init(
    store: CNContactStore,
    appContext: AppContext?,
    contactRepository: ContactRepository,
    groupRepository: GroupRepository,
    contactFactory: ContactFactory
  ) {
    self.store = store
    self.appContext = appContext
    self.contactRepository = contactRepository
    self.groupRepository = groupRepository
    self.contactFactory = contactFactory
  }

  private let delegate = ContactControllerDelegate()
  private var presentingViewController: UIViewController?
  private var contactPickerDelegate: ContactPickerControllerDelegate?
  private var contactPickingPromise: Promise?
  private var contactManipulationPromise: Promise?

  func editWithForm(for contact: ContactNext, options: EditFormOptions?, promise: Promise) throws {
    if contactManipulationPromise != nil {
      throw ContactManipulationInProgressException()
    }
    guard let foundContact = contactRepository.getById(
      id: contact.id,
      keysToFetch: [CNContactViewController.descriptorForRequiredKeys()]
    ) else {
      throw ContactNotFoundException(contact.id)
    }

    var controller = ContactsViewController(for: foundContact)
    try setEditControllerOptions(controller: &controller, options: options)

    if let parent = appContext?.utilities?.currentViewController() {
      let navController = UINavigationController(rootViewController: controller)
      presentingViewController = navController

      controller.onViewDisappeared = {
        promise.resolve()
        self.contactManipulationPromise = nil
      }

      contactManipulationPromise = promise
      parent.present(navController, animated: options?.preventAnimation != true)
    } else {
      contactManipulationPromise = nil
      throw MissingViewControllerException()
    }
  }

  func presentAddForm(contact: CNContact, options: CreateFormOptions?, promise: Promise) throws {
    if contactManipulationPromise != nil {
      throw ContactManipulationInProgressException()
    }
    var controller = ContactsViewController(for: contact)
    setCreateControllerOptions(controller: &controller, options: options)

    if let parent = appContext?.utilities?.currentViewController() {
      let navController = UINavigationController(rootViewController: controller)
      presentingViewController = navController

      controller.onViewDisappeared = {
        promise.resolve()
        self.contactManipulationPromise = nil
      }

      contactManipulationPromise = promise
      parent.present(navController, animated: options?.preventAnimation != true)
    } else {
      contactManipulationPromise = nil
      throw MissingViewControllerException()
    }
  }

  func presentPicker(promise: Promise) throws {
    if contactPickingPromise != nil {
      throw ContactPickingInProgressException()
    }
    let pickerDelegate = ContactPickerControllerDelegate(onContactPickingResultHandler: self)

    let pickerController = CNContactPickerViewController()
    pickerController.delegate = pickerDelegate

    guard let currentController = appContext?.utilities?.currentViewController() else {
      throw MissingViewControllerException()
    }
    currentController.present(pickerController, animated: true)

    contactPickerDelegate = pickerDelegate
    contactPickingPromise = promise
  }

  private func applyCancelButton(to controller: inout ContactsViewController, showsCancelButton: Bool?, cancelButtonTitle: String?) {
    if showsCancelButton != false {
      controller.setCloseButton(title: cancelButtonTitle ?? "Cancel")
    }
  }

  private func setEditControllerOptions(controller: inout ContactsViewController, options: EditFormOptions?) throws {
    controller.contactStore = store
    controller.delegate = delegate
    applyCancelButton(to: &controller, showsCancelButton: options?.showsCancelButton, cancelButtonTitle: options?.cancelButtonTitle)
    guard let options = options else {
      return
    }
    if let displayedPropertyKeys = options.displayedPropertyKeys {
      let keys = contactKeysToFetch(from: displayedPropertyKeys)
      controller.displayedPropertyKeys = getDescriptors(for: keys)
    }
    if let allowsEditing = options.allowsEditing {
      controller.allowsEditing = allowsEditing
    }
    if let allowsActions = options.allowsActions {
      controller.allowsActions = allowsActions
    }
    if let shouldShowLinkedContacts = options.shouldShowLinkedContacts {
      controller.shouldShowLinkedContacts = shouldShowLinkedContacts
    }
    if let message = options.message {
      controller.message = message
    }
    if let alternateName = options.alternateName {
      controller.alternateName = alternateName
    }
    if let groupId = options.groupId {
      controller.parentGroup = try groupRepository.getById(groupId: groupId)
    }
  }

  private func setCreateControllerOptions(controller: inout ContactsViewController, options: CreateFormOptions?) {
    controller.contactStore = store
    controller.delegate = delegate
    applyCancelButton(to: &controller, showsCancelButton: options?.showsCancelButton, cancelButtonTitle: options?.cancelButtonTitle)
  }

  func presentAccessPicker(promise: Promise) throws {
    guard #available(iOS 18.0, *) else {
      throw AccessPickerUnavailableException()
    }
    guard let currentViewController = appContext?.utilities?.currentViewController() else {
      throw MissingCurrentViewControllerException()
    }
    ContactAccessPickerNext.present(
      inViewController: currentViewController,
      contactFactory: contactFactory,
      promise: promise
    )
  }

  internal func didPickContact(contact: CNContact) throws {
    defer {
      contactPickingPromise = nil
    }
    contactPickingPromise?.resolve(
      contactFactory.create(id: contact.identifier)
    )
  }

  internal func didCancelPickingContact() {
    contactPickingPromise?.resolve(NSNull())
    contactPickingPromise = nil
  }
}
