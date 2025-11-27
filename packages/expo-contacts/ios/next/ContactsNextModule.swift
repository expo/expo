import ExpoModulesCore
import ContactsUI
import Contacts

public class ContactsNextModule: Module {
  private let contactStore = CNContactStore()
  private lazy var contactRepository = ContactRepository(store: contactStore)
  private lazy var groupRepository = GroupRepository(store: contactStore)
  private lazy var containerRepository = ContainerRepository(store: contactStore)
  private lazy var imageService = ImageService(appContext: appContext)

  private lazy var contactFactory = ContactFactory(
    contactRepository: contactRepository,
    imageService: imageService
  )
  
  private lazy var formDelegate = FormDelegate(
    store: contactStore,
    appContext: appContext,
    contactRepository: contactRepository,
    groupRepository: groupRepository,
    contactFactory: contactFactory
  )
  
  private var contactPickingPromise: Promise?
  private var contactManipulationPromise: Promise?
  
  public func definition() -> ModuleDefinition {
    Name("ExpoContactsNext")
    
    Class(ContactNext.self) {
      Constructor { (id: String) in
        contactFactory.create(id: id)
      }
      
      Property("id") { (this: ContactNext) in
        this.id
      }
      
      AsyncFunction("update") { (this: ContactNext, createContactRecord: CreateContactRecord) in
        try this.update(createContactRecord)
      }
      
      AsyncFunction("patch") { (this: ContactNext, patchContactRecord: PatchContactRecord) in
        try this.patch(patchContactRecord)
      }
      
      AsyncFunction("delete") { (this: ContactNext) in
        try await this.delete()
      }
      
      AsyncFunction("getDetails") { (this: ContactNext, fields: [ContactField]?) in
        try this.getDetails(fields: fields)
      }
      
      AsyncFunction("addEmail") { (this: ContactNext, email: NewEmailRecord) in
        try await this.emails.add(email)
      }
      
      AsyncFunction("getEmails") { (this: ContactNext) in
        try await this.emails.get()
      }
      
      AsyncFunction("updateEmail") { (this: ContactNext, email: ExistingEmailRecord) in
        try await this.emails.update(email)
      }
      
      AsyncFunction("deleteEmail") { (this: ContactNext, email: ExistingEmailRecord) in
        try await this.emails.delete(email)
      }
      
      AsyncFunction("addPhone") { (this: ContactNext, phone: NewPhoneRecord) in
        try await this.phones.add(phone)
      }
      
      AsyncFunction("getPhones") { (this: ContactNext) in
        try await this.phones.get()
      }
      
      AsyncFunction("updatePhone") { (this: ContactNext, phone: ExistingPhoneRecord) in
        try await this.phones.update(phone)
      }
      
      AsyncFunction("deletePhone") { (this: ContactNext, phone: ExistingPhoneRecord) in
        try await this.phones.delete(phone)
      }
      
      AsyncFunction("addDate") { (this: ContactNext, date: NewDateRecord) in
        try await this.dates.add(date)
      }
      
      AsyncFunction("getDates") { (this: ContactNext) in
        try await this.dates.get()
      }
      
      AsyncFunction("deleteDate") { (this: ContactNext, date: ExistingDateRecord) in
        try await this.dates.delete(date)
      }
      
      AsyncFunction("updateDate") { (this: ContactNext, date: ExistingDateRecord) in
        try await this.dates.update(date)
      }
      
      AsyncFunction("addAddress") { (this: ContactNext, address: NewPostalAddressRecord) in
        try await this.addresses.add(address)
      }
      
      AsyncFunction("getAddresses") { (this: ContactNext) in
        try await this.addresses.get()
      }
      
      AsyncFunction("deleteAddress") { (this: ContactNext, address: ExistingPostalAddressRecord) in
        try await this.addresses.delete(address)
      }
      
      AsyncFunction("updateAddress") { (this: ContactNext, address: ExistingPostalAddressRecord) in
        try await this.addresses.update(address)
      }
      
      AsyncFunction("addRelation") { (this: ContactNext, relation: NewRelationRecord) in
        try await this.relations.add(relation)
      }
      
      AsyncFunction("getRelations") { (this: ContactNext) in
        try await this.relations.get()
      }
      
      AsyncFunction("deleteRelation") { (this: ContactNext, relation: ExistingRelationRecord) in
        try await this.relations.delete(relation)
      }
      
      AsyncFunction("updateRelation") { (this: ContactNext, relation: ExistingRelationRecord) in
        try await this.relations.update(relation)
      }
      
      AsyncFunction("addUrlAddress") { (this: ContactNext, urlAddress: NewUrlAddressRecord) in
        try await this.urlAddresses.add(urlAddress)
      }
      
      AsyncFunction("getUrlAddresses") { (this: ContactNext) in
        try await this.urlAddresses.get()
      }
      
      AsyncFunction("deleteUrlAddress") { (this: ContactNext, urlAddress: ExistingUrlAddressRecord) in
        try await this.urlAddresses.delete(urlAddress)
      }
      
      AsyncFunction("updateUrlAddress") { (this: ContactNext, urlAddress: ExistingUrlAddressRecord) in
        try await this.urlAddresses.update(urlAddress)
      }
      
      AsyncFunction("addImAddress") { (this: ContactNext, imAddress: NewImAddressRecord) in
        try await this.imAddresses.add(imAddress)
      }
      
      AsyncFunction("getImAddresses") { (this: ContactNext) in
        try await this.imAddresses.get()
      }
      
      AsyncFunction("deleteImAddress") { (this: ContactNext, imAddress: ExistingImAddressRecord) in
        try await this.imAddresses.delete(imAddress)
      }
      
      AsyncFunction("updateImAddress") { (this: ContactNext, imAddress: ExistingImAddressRecord) in
        try await this.imAddresses.update(imAddress)
      }
      
      AsyncFunction("addSocialProfile") { (this: ContactNext, profile: NewSocialProfileRecord) in
        try await this.socialProfiles.add(profile)
      }
      
      AsyncFunction("getSocialProfiles") { (this: ContactNext) in
        try await this.socialProfiles.get()
      }
      
      AsyncFunction("deleteSocialProfile") { (this: ContactNext, profile: ExistingSocialProfileRecord) in
        try await this.socialProfiles.delete(profile)
      }
      
      AsyncFunction("updateSocialProfile") { (this: ContactNext, profile: ExistingSocialProfileRecord) in
        try await this.socialProfiles.update(profile)
      }

      AsyncFunction("getFullName") { (this: ContactNext) in
        try this.getFullName()
      }
      
      AsyncFunction("getGivenName") { (this: ContactNext) in
        try this.givenName.get()
      }
      
      AsyncFunction("setGivenName") { (this: ContactNext, givenName: String?) in
        try this.givenName.set(givenName)
      }
      
      AsyncFunction("getFamilyName") { (this: ContactNext) in
        try this.familyName.get()
      }
      
      AsyncFunction("setFamilyName") { (this: ContactNext, familyName: String?) in
        try this.familyName.set(familyName)
      }
      
      AsyncFunction("getMaidenName") { (this: ContactNext) in
        try this.maidenName.get()
      }
      
      AsyncFunction("setMaidenName") { (this: ContactNext, maidenName: String?) in
        try this.maidenName.set(maidenName)
      }
      
      AsyncFunction("getNickname") { (this: ContactNext) in
        try this.nickname.get()
      }
      
      AsyncFunction("setNickname") { (this: ContactNext, nickname: String?) in
        try this.nickname.set(nickname)
      }
      
      AsyncFunction("getMiddleName") { (this: ContactNext) in
        try this.middleName.get()
      }
      
      AsyncFunction("setMiddleName") { (this: ContactNext, middleName: String?) in
        try this.middleName.set(middleName)
      }
      
      AsyncFunction("getPrefix") { (this: ContactNext) in
        try this.prefix.get()
      }
      
      AsyncFunction("setPrefix") { (this: ContactNext, prefix: String?) in
        try this.prefix.set(prefix)
      }
      
      AsyncFunction("getSuffix") { (this: ContactNext) in
        try this.suffix.get()
      }
      
      AsyncFunction("setSuffix") { (this: ContactNext, suffix: String?) in
        try this.suffix.set(suffix)
      }
      
      AsyncFunction("getPhoneticGivenName") { (this: ContactNext) in
        try this.phoneticGivenName.get()
      }
      
      AsyncFunction("setPhoneticGivenName") { (this: ContactNext, phoneticGivenName: String?) in
        try this.phoneticGivenName.set(phoneticGivenName)
      }
      
      AsyncFunction("getPhoneticMiddleName") { (this: ContactNext) in
        try this.phoneticMiddleName.get()
      }
      
      AsyncFunction("setPhoneticMiddleName") { (this: ContactNext, phoneticMiddleName: String?) in
        try this.phoneticMiddleName.set(phoneticMiddleName)
      }
      
      AsyncFunction("getPhoneticFamilyName") { (this: ContactNext) in
        try this.phoneticFamilyName.get()
      }
      
      AsyncFunction("setPhoneticFamilyName") { (this: ContactNext, phoneticFamilyName: String?) in
        try this.phoneticFamilyName.set(phoneticFamilyName)
      }
      
      AsyncFunction("getCompany") { (this: ContactNext) in
        try this.company.get()
      }
      
      AsyncFunction("setCompany") { (this: ContactNext, company: String?) in
        try this.company.set(company)
      }
      
      AsyncFunction("getJobTitle") { (this: ContactNext) in
        try this.jobTitle.get()
      }
      
      AsyncFunction("setJobTitle") { (this: ContactNext, jobTitle: String?) in
        try this.jobTitle.set(jobTitle)
      }
      
      AsyncFunction("getDepartment") { (this: ContactNext) in
        try this.department.get()
      }
      
      AsyncFunction("setDepartment") { (this: ContactNext, department: String?) in
        try this.department.set(department)
      }
      
      AsyncFunction("getPhoneticCompanyName") { (this: ContactNext) in
        try this.phoneticCompanyName.get()
      }
      
      AsyncFunction("setPhoneticCompanyName") { (this: ContactNext, phoneticCompanyName: String?) in
        try this.phoneticCompanyName.set(phoneticCompanyName)
      }
      
      AsyncFunction("getNote") { (this: ContactNext) in
        try this.note.get()
      }
      
      AsyncFunction("setNote") { (this: ContactNext, note: String?) in
        try this.note.set(note)
      }
      
      AsyncFunction("getImage") { (this: ContactNext) in
        try this.image.get()
      }
      
      AsyncFunction("setImage") { (this: ContactNext, image: String?) in
        try this.image.set(image)
      }
      
      AsyncFunction("getBirthday") { (this: ContactNext) in
        try this.birthday.get()
      }
      
      AsyncFunction("setBirthday") { (this: ContactNext, birthday: ContactDateNext?) in
        try this.birthday.set(birthday)
      }
      
      AsyncFunction("getNonGregorianBirthday") { (this: ContactNext) in
        try this.nonGregorianBirthday.get()
      }
      
      AsyncFunction("setNonGregorianBirthday") { (this: ContactNext, nonGregorianBirthday: NonGregorianBirthday?) in
        try this.nonGregorianBirthday.set(nonGregorianBirthday)
      }
      
      AsyncFunction("getThumbnail") { (this: ContactNext) in
        try this.thumbnail.get()
      }
      
      AsyncFunction("editWithForm") { (this: ContactNext, options: FormOptions?, promise: Promise) in
        try formDelegate.presentEditForm(for: this, options: options ?? nil, promise: promise)
      }.runOnQueue(.main)
      
      StaticAsyncFunction("getAll") { (queryOptions: ContactQueryOptions?) in
        return try ContactNext.getAll(queryOptions: queryOptions, contactRepository: contactRepository, contactFactory: contactFactory)
      }
      
      StaticAsyncFunction("getCount") { () in
        return try contactRepository.getCount()
      }
      
      StaticAsyncFunction("hasAnyContacts") { () in
        return try contactRepository.hasAny()
      }

      StaticAsyncFunction("create") { (createContactRecord: CreateContactRecord) in
        return try ContactNext.create(
          createContactRecord: createContactRecord,
          contactRepository: contactRepository,
          imageService: imageService,
          contactFactory: contactFactory
        )
      }
      
      StaticAsyncFunction("createWithForm") { (options: FormOptions?, promise: Promise) in
        try formDelegate.presentAddForm(contact: CNContact(), options: options, promise: promise)
      }.runOnQueue(.main)
      
      StaticAsyncFunction("presentPicker") { (promise: Promise) in
        return try formDelegate.presentPicker(promise: promise)
      }.runOnQueue(.main)
      
      StaticAsyncFunction("presentAccessPicker") { (promise: Promise) in
        return formDelegate.presentAccessPicker(promise: promise)
      }.runOnQueue(.main)
      
      StaticAsyncFunction("getAllDetails") { (fields: [ContactField], contactQueryOptions: ContactQueryOptions?) in
        return try ContactNext.getAllDetails(
          fields: fields,
          queryOptions: contactQueryOptions,
          contactRepository: contactRepository,
          getContactDetailsMapper: GetContactDetailsMapper(imageService: imageService)
        )
      }
      
      StaticAsyncFunction("getPermissionsAsync") { (promise: Promise) in
        appContext?.permissions?.getPermissionUsingRequesterClass(
          ContactsPermissionRequester.self,
          resolve: promise.resolver,
          reject: promise.legacyRejecter
        )
      }
      
      StaticAsyncFunction("requestPermissionsAsync") { (promise: Promise) in
        appContext?.permissions?.askForPermission(
          usingRequesterClass: ContactsPermissionRequester.self,
          resolve: promise.resolver,
          reject: promise.legacyRejecter
        )
      }
    }
    
    Class(Group.self) {
      Constructor { (id: String) in
        Group(
          id: id,
          groupRepository: groupRepository,
          contactRepository: contactRepository,
          contactFactory: contactFactory
        )
      }
      
      Property("id") { (this: Group) in
        this.id
      }
      
      AsyncFunction("getName") { (this: Group) in
        return try this.name()
      }
      
      AsyncFunction("setName") { (this: Group, name: String) in
        try this.updateName(name)
      }
      
      AsyncFunction("addContact") { (this: Group, contact: ContactNext) in
        try this.addContact(contact: contact)
      }
      
      AsyncFunction("removeContact") { (this: Group, contact: ContactNext) in
        try this.removeContact(contact: contact)
      }
      
      AsyncFunction("getContacts") { (this: Group, contactQueryOptions: ContactQueryOptions?) in
        try this.getContacts(contactQueryOptions)
      }

      AsyncFunction("delete") { (this: Group) in
        try this.delete()
      }
      
      StaticAsyncFunction("create") { (name: String, containerId: String?) in
        return try Group.create(
          name: name,
          containerId: containerId,
          groupRepository: groupRepository,
          contactRepository: contactRepository,
          contactFactory: contactFactory
        )
      }
      
      StaticAsyncFunction("getAll") { (containerId: String?) in
        return try Group.getAll(
          containerId: containerId,
          groupRepository: groupRepository,
          contactRepository: contactRepository,
          contactFactory: contactFactory
        )
      }
    }
    
    Class(Container.self) {
      Constructor { (id: String) in
        Container(
          id: id,
          containerRepository: containerRepository,
          contactRepository: contactRepository,
          groupRepository: groupRepository,
          contactFactory: contactFactory
        )
      }
      
      Property("id") { (this: Container) in
        this.id
      }
      
      AsyncFunction("getName") { (this: Container) in
        try this.name()
      }
      
      AsyncFunction("getType") { (this: Container) in
        try this.type()
      }
      
      AsyncFunction("getGroups") { (this: Container) in
        try this.getGroups()
      }
      
      AsyncFunction("getContacts") { (this: Container, contactQueryOptions: ContactQueryOptions?) in
        try this.getContacts(contactQueryOptions)
      }
      
      StaticAsyncFunction("getAll") {
        return try Container.getAll(
          containerRepository: containerRepository,
          contactRepository: contactRepository,
          groupRepository: groupRepository,
          contactFactory: contactFactory
        )
      }
      
      StaticAsyncFunction("getDefault") {
        return try Container.getDefault(
          containerRepository: containerRepository,
          contactRepository: contactRepository,
          groupRepository: groupRepository,
          contactFactory: contactFactory
        )
      }
    }
  }
}
