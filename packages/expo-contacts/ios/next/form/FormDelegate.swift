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
  
  func presentEditForm(for contact: ContactNext, options: FormOptions?, promise: Promise) throws {
    if contactManipulationPromise != nil {
      throw ContactManipulationInProgressException()
    }
    guard let foundContact = contactRepository.getById(
      id: contact.id,
      keysToFetch: [CNContactViewController.descriptorForRequiredKeys()]
    ) else {
      return promise.reject(ContactNotFoundException(contact.id))
    }
    
    var controller = ContactsViewController(for: foundContact)
    try setControllerOptions(controller: &controller, options: options)
    
    
    if let parent = appContext?.utilities?.currentViewController() {
      let navController = UINavigationController(rootViewController: controller)
      presentingViewController = navController
      
      controller.onViewDisappeared = {
        promise.resolve()
        self.contactManipulationPromise = nil
      }
      
      contactManipulationPromise = promise
      parent.present(navController, animated: options?.preventAnimation ?? false != true)
    } else {
      contactManipulationPromise = nil
      promise.reject(MissingViewControllerException())
    }
  }
  
  func presentAddForm(contact: CNContact, options: FormOptions?, promise: Promise) throws {
    if contactManipulationPromise != nil {
      throw ContactManipulationInProgressException()
    }
    var controller = ContactsViewController(for: contact)
    try setControllerOptions(controller: &controller, options: options)
    
    if let parent = appContext?.utilities?.currentViewController() {
      let navController = UINavigationController(rootViewController: controller)
      presentingViewController = navController
      
      controller.onViewDisappeared = {
        promise.resolve()
        self.contactManipulationPromise = nil
      }
      
      contactManipulationPromise = promise
      parent.present(navController, animated: options?.preventAnimation ?? false != true)
    } else {
      contactManipulationPromise = nil
      promise.reject(MissingViewControllerException())
    }
  }
  
  func presentPicker(promise: Promise) throws {
    if contactPickingPromise != nil {
      throw ContactPickingInProgressException()
    }

    let pickerController = CNContactPickerViewController()

    contactPickerDelegate = ContactPickerControllerDelegate(onContactPickingResultHandler: self)

    pickerController.delegate = self.contactPickerDelegate

    let currentController = appContext?.utilities?.currentViewController()

    contactPickingPromise = promise

    currentController?.present(pickerController, animated: true)
  }

  private func setControllerOptions(controller: inout ContactsViewController, options: FormOptions?) throws {
    controller.contactStore = store
    controller.delegate = delegate
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
  
  func presentAccessPicker(promise: Promise) {
    guard #available(iOS 18.0, *) else {
      return promise.reject(AccessPickerUnavailableException())
    }
    guard let currentViewController = appContext?.utilities?.currentViewController() else {
      return promise.reject(MissingCurrentViewControllerException())
    }
    ContactAccessPicker.present(inViewController: currentViewController, promise: promise)
  }
  
  func didPickContact(contact: CNContact) throws {
    defer {
      contactPickingPromise = nil
    }
    contactPickingPromise?.resolve(
      contactFactory.create(id: contact.identifier)
    )
  }

  func didCancelPickingContact() {
    contactPickingPromise?.resolve()
    contactPickingPromise = nil
  }
}

