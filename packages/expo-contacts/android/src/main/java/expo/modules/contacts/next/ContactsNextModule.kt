package expo.modules.contacts.next

import expo.modules.contacts.next.intents.ContactIntentDelegate
import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.mappers.ContactRecordDomainMapper
import expo.modules.contacts.next.observers.ContactsObserverDelegate
import expo.modules.contacts.next.records.SkipFormatter
import expo.modules.contacts.next.records.contact.PatchContactRecord
import expo.modules.contacts.next.records.contact.CreateContactRecord
import expo.modules.contacts.next.records.fields.ContactField
import expo.modules.contacts.next.records.fields.DateRecord
import expo.modules.contacts.next.records.fields.EmailRecord
import expo.modules.contacts.next.records.fields.ExtraNameRecord
import expo.modules.contacts.next.records.fields.PhoneRecord
import expo.modules.contacts.next.records.fields.PostalAddressRecord
import expo.modules.contacts.next.records.fields.RelationRecord
import expo.modules.contacts.next.records.fields.UrlAddressRecord
import expo.modules.contacts.next.services.ImageByteArrayConverter
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.getValue

class ContactsNextModule : Module() {
  private val context
    get() = appContext.reactContext
      ?: throw Exceptions.ReactContextLost()

  private val contactMapper by lazy {
    ContactRecordDomainMapper(ImageByteArrayConverter(context.contentResolver))
  }

  private val contactIntentDelegate = ContactIntentDelegate()

  private val contactRepository by lazy {
    ContactRepository(context.contentResolver)
  }

  private val contactFactory by lazy {
    ContactFactory(contactRepository, contactMapper, contactIntentDelegate)
  }

  private val permissionsDelegate by lazy {
    ContactsPermissionsDelegate(appContext)
  }
  private val observerDelegate by lazy {
    ContactsObserverDelegate(appContext, this@ContactsNextModule)
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoContactsNext")

    Class(Contact::class) {
      Constructor { id: String ->
        contactFactory.create(id)
      }

      Property("id") { self: Contact ->
        self.contactId.value
      }

      AsyncFunction("getDetails") Coroutine { self: Contact, fields: Set<ContactField>? ->
        SkipFormatter(fields).format(
          self.getDetails(fields)
        )
      }

      AsyncFunction("delete") Coroutine { self: Contact ->
        self.delete()
      }

      AsyncFunction("patch") Coroutine { self: Contact, patchContactRecord: PatchContactRecord ->
        self.patch(patchContactRecord)
      }

      AsyncFunction("getGivenName") Coroutine { self: Contact ->
        self.givenName.get()
      }

      AsyncFunction("setGivenName") Coroutine { self: Contact, newGivenName: String? ->
        self.givenName.set(newGivenName)
      }

      AsyncFunction("getFamilyName") Coroutine { self: Contact ->
        self.familyName.get()
      }

      AsyncFunction("setFamilyName") Coroutine { self: Contact, newFamilyName: String? ->
        self.familyName.set(newFamilyName)
      }

      AsyncFunction("getMiddleName") Coroutine { self: Contact ->
        self.middleName.get()
      }

      AsyncFunction("setMiddleName") Coroutine { self: Contact, newMiddleName: String? ->
        self.middleName.set(newMiddleName)
      }

      AsyncFunction("getPrefix") Coroutine { self: Contact ->
        self.prefix.get()
      }

      AsyncFunction("setPrefix") Coroutine { self: Contact, newPrefix: String? ->
        self.prefix.set(newPrefix)
      }

      AsyncFunction("getSuffix") Coroutine { self: Contact ->
        self.suffix.get()
      }

      AsyncFunction("setSuffix") Coroutine { self: Contact, newSuffix: String? ->
        self.suffix.set(newSuffix)
      }

      AsyncFunction("getPhoneticGivenName") Coroutine { self: Contact ->
        self.phoneticGivenName.get()
      }

      AsyncFunction("setPhoneticGivenName") Coroutine { self: Contact, newPhoneticGivenName: String? ->
        self.phoneticGivenName.set(newPhoneticGivenName)
      }

      AsyncFunction("getPhoneticMiddleName") Coroutine { self: Contact ->
        self.phoneticMiddleName.get()
      }

      AsyncFunction("setPhoneticMiddleName") Coroutine { self: Contact, newPhoneticMiddleName: String? ->
        self.phoneticMiddleName.set(newPhoneticMiddleName)
      }

      AsyncFunction("getPhoneticFamilyName") Coroutine { self: Contact ->
        self.phoneticFamilyName.get()
      }

      AsyncFunction("setPhoneticFamilyName") Coroutine { self: Contact, newPhoneticFamilyName: String? ->
        self.phoneticFamilyName.set(newPhoneticFamilyName)
      }

      AsyncFunction("getCompany") Coroutine { self: Contact ->
        self.company.get()
      }

      AsyncFunction("setCompany") Coroutine { self: Contact, newCompany: String? ->
        self.company.set(newCompany)
      }

      AsyncFunction("getDepartment") Coroutine { self: Contact ->
        self.department.get()
      }

      AsyncFunction("setDepartment") Coroutine { self: Contact, newDepartment: String? ->
        self.department.set(newDepartment)
      }

      AsyncFunction("getJobTitle") Coroutine { self: Contact ->
        self.jobTitle.get()
      }

      AsyncFunction("setJobTitle") Coroutine { self: Contact, newJobTitle: String? ->
        self.jobTitle.set(newJobTitle)
      }

      AsyncFunction("getPhoneticCompanyName") Coroutine { self: Contact ->
        self.phoneticCompanyName.get()
      }

      AsyncFunction("setPhoneticCompanyName") Coroutine { self: Contact, newPhoneticName: String? ->
        self.phoneticCompanyName.set(newPhoneticName)
      }

      AsyncFunction("getNote") Coroutine { self: Contact ->
        self.note.get()
      }

      AsyncFunction("setNote") Coroutine { self: Contact, newNote: String? ->
        self.note.set(newNote)
      }

      AsyncFunction("getImage") Coroutine { self: Contact ->
        self.imageUri.get()
      }

      AsyncFunction("setImage") Coroutine { self: Contact, imageUri: String? ->
        self.image.set(imageUri)
      }

      AsyncFunction("getThumbnail") Coroutine { self: Contact ->
        self.thumbnail.get()
      }

      AsyncFunction("getIsFavourite") Coroutine { self: Contact ->
        self.isFavourite.get()
      }

      AsyncFunction("getEmails") Coroutine { self: Contact ->
        self.emails.getAll()
      }

      AsyncFunction("addEmail") Coroutine { self: Contact, emailRecord: EmailRecord.New ->
        self.emails.add(emailRecord)
      }

      AsyncFunction("updateEmail") Coroutine { self: Contact, emailRecord: EmailRecord.Existing ->
        self.emails.update(emailRecord)
      }

      AsyncFunction("deleteEmail") Coroutine { self: Contact, emailRecord: EmailRecord.Existing ->
        self.emails.delete(emailRecord)
      }

      AsyncFunction("getPhones") Coroutine { self: Contact ->
        self.phones.getAll()
      }

      AsyncFunction("addPhone") Coroutine { self: Contact, phoneRecord: PhoneRecord.New ->
        self.phones.add(phoneRecord)
      }

      AsyncFunction("updatePhone") Coroutine { self: Contact, phoneRecord: PhoneRecord.Existing ->
        self.phones.update(phoneRecord)
      }

      AsyncFunction("deletePhone") Coroutine { self: Contact, phoneRecord: PhoneRecord.Existing ->
        self.phones.delete(phoneRecord)
      }

      AsyncFunction("getAddresses") Coroutine { self: Contact ->
        self.addresses.getAll()
      }

      AsyncFunction("addAddress") Coroutine { self: Contact, postalAddressRecord: PostalAddressRecord.New ->
        self.addresses.add(postalAddressRecord)
      }

      AsyncFunction("updateAddress") Coroutine { self: Contact, addressRecord: PostalAddressRecord.Existing ->
        self.addresses.update(addressRecord)
      }

      AsyncFunction("deleteAddress") Coroutine { self: Contact, addressRecord: PostalAddressRecord.Existing ->
        self.addresses.delete(addressRecord)
      }

      AsyncFunction("getDates") Coroutine { self: Contact ->
        self.dates.getAll()
      }

      AsyncFunction("addDate") Coroutine { self: Contact, dateRecord: DateRecord.New ->
        self.dates.add(dateRecord)
      }

      AsyncFunction("updateDate") Coroutine { self: Contact, dateRecord: DateRecord.Existing ->
        self.dates.update(dateRecord)
      }

      AsyncFunction("deleteDate") Coroutine { self: Contact, dateRecord: DateRecord.Existing ->
        self.dates.delete(dateRecord)
      }

      AsyncFunction("getExtraNames") Coroutine { self: Contact ->
        self.extraNames.getAll()
      }

      AsyncFunction("addExtraName") Coroutine { self: Contact, extraNameRecord: ExtraNameRecord.New ->
        self.extraNames.add(extraNameRecord)
      }

      AsyncFunction("updateExtraName") Coroutine { self: Contact, extraNameRecord: ExtraNameRecord.Existing ->
        self.extraNames.update(extraNameRecord)
      }

      AsyncFunction("deleteExtraName") Coroutine { self: Contact, extraNameRecord: ExtraNameRecord.Existing ->
        self.extraNames.delete(extraNameRecord)
      }

      AsyncFunction("getRelations") Coroutine { self: Contact ->
        self.relations.getAll()
      }

      AsyncFunction("addRelation") Coroutine { self: Contact, relationRecord: RelationRecord.New ->
        self.relations.add(relationRecord)
      }

      AsyncFunction("updateRelation") Coroutine { self: Contact, relationRecord: RelationRecord.Existing ->
        self.relations.update(relationRecord)
      }

      AsyncFunction("deleteRelation") Coroutine { self: Contact, relationRecord: RelationRecord.Existing ->
        self.relations.delete(relationRecord)
      }

      AsyncFunction("getUrlAddresses") Coroutine { self: Contact ->
        self.urlAddresses.getAll()
      }

      AsyncFunction("addUrlAddress") Coroutine { self: Contact, urlAddressRecord: UrlAddressRecord.New ->
        self.urlAddresses.add(urlAddressRecord)
      }

      AsyncFunction("updateUrlAddress") Coroutine { self: Contact, urlAddressRecord: UrlAddressRecord.Existing ->
        self.urlAddresses.update(urlAddressRecord)
      }

      AsyncFunction("deleteUrlAddress") Coroutine { self: Contact, urlAddressRecord: UrlAddressRecord.Existing ->
        self.urlAddresses.delete(urlAddressRecord)
      }

      AsyncFunction("editWithForm") Coroutine { self: Contact ->
        self.editWithForm()
      }

      StaticAsyncFunction("create") Coroutine { createContactRecord: CreateContactRecord ->
        permissionsDelegate.ensurePermissions()
        Contact.create(createContactRecord, contactRepository, contactMapper, contactFactory)
      }

      StaticAsyncFunction("addWithForm") Coroutine { createContactRecord: CreateContactRecord ->
        Contact.createWithForm(createContactRecord, contactMapper, contactIntentDelegate)
      }

      StaticAsyncFunction("pick") Coroutine { ->
        Contact.pick(contactIntentDelegate, contactFactory)
      }

      StaticAsyncFunction("getAll") Coroutine { ->
        Contact.getAll(contactRepository, contactFactory)
      }

      StaticAsyncFunction("getAllDetails") Coroutine { fields: List<ContactField> ->
        Contact.getAllWithDetails(contactRepository, contactMapper, fields)
      }

      StaticAsyncFunction("requestPermissionsAsync") { promise: Promise ->
        permissionsDelegate.requestPermissions(promise)
      }

      StaticAsyncFunction("getPermissions") { promise: Promise ->
        permissionsDelegate.getPermissions(promise)
      }
    }

    Events(ContactsObserverDelegate.ON_CONTACTS_CHANGE_EVENT_NAME)

    OnDestroy {
      observerDelegate.stopObservingContactChanges()
    }

    OnStartObserving(ContactsObserverDelegate.ON_CONTACTS_CHANGE_EVENT_NAME) {
      observerDelegate.startObservingContactChanges()
    }

    OnStopObserving(ContactsObserverDelegate.ON_CONTACTS_CHANGE_EVENT_NAME) {
      observerDelegate.stopObservingContactChanges()
    }

    RegisterActivityContracts {
      with(contactIntentDelegate) {
        registerContactContracts()
      }
    }
  }
}
