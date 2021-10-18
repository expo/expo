package expo.modules.contacts

import android.net.Uri
import android.util.Log
import android.os.Bundle
import android.text.TextUtils
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.content.ContentValues
import android.provider.ContactsContract
import android.content.ContentProviderOperation
import android.provider.ContactsContract.RawContacts
import android.provider.ContactsContract.CommonDataKinds
import android.provider.ContactsContract.CommonDataKinds.StructuredName

import expo.modules.contacts.models.DateModel
import expo.modules.contacts.models.EmailModel
import expo.modules.contacts.models.ImAddressModel
import expo.modules.contacts.models.PhoneNumberModel
import expo.modules.contacts.models.PostalAddressModel
import expo.modules.contacts.models.RelationshipModel
import expo.modules.contacts.models.UrlAddressModel
import expo.modules.contacts.models.ExtraNameModel
import expo.modules.contacts.models.BaseModel

import java.util.*
import java.lang.Exception
import java.text.ParseException
import java.text.SimpleDateFormat
import java.io.ByteArrayOutputStream

// TODO: MaidenName Nickname
class Contact(internal var contactId: String) {
  internal var rawContactId: String? = null
  internal var lookupKey: String? = null
  internal var displayName: String? = null
  internal var isMe = false
  internal var hasPhoto = false
  internal var photoUri: String? = null
  internal var rawPhotoUri: String? = null
  internal var contactType = "person"
  internal var firstName: String? = ""
  internal var middleName: String? = ""
  internal var lastName: String? = ""

  // protected String nickname = "";
  internal var prefix = ""
  internal var suffix = ""
  internal var phoneticFirstName = ""
  internal var phoneticMiddleName = ""
  internal var phoneticLastName = ""
  internal var company: String? = ""
  internal var department = ""
  internal var jobTitle = ""
  internal var note: String? = null
  internal var dates: MutableList<BaseModel> = ArrayList()
  internal var emails: MutableList<BaseModel> = ArrayList()
  internal var imAddresses: MutableList<BaseModel> = ArrayList()
  internal var phones: MutableList<BaseModel> = ArrayList()
  internal var addresses: MutableList<BaseModel> = ArrayList()
  internal var relationships: MutableList<BaseModel> = ArrayList()
  internal var urlAddresses: MutableList<BaseModel> = ArrayList()
  internal var extraNames: MutableList<BaseModel> = ArrayList()

  fun fromCursor(cursor: Cursor) {
    rawContactId = cursor.getString(cursor.getColumnIndex(ContactsContract.Data.RAW_CONTACT_ID))
    val mimeType = cursor.getString(cursor.getColumnIndex(ContactsContract.Data.MIMETYPE))
    val name = cursor.getString(cursor.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME))

    if (!TextUtils.isEmpty(name) && TextUtils.isEmpty(displayName)) {
      displayName = name
    }
    if (TextUtils.isEmpty(rawPhotoUri)) {
      val rawPhotoURI = cursor.getString(cursor.getColumnIndex(EXColumns.PHOTO_URI))
      if (!TextUtils.isEmpty(rawPhotoURI)) {
        hasPhoto = true
        rawPhotoUri = rawPhotoURI
      }
    }
    if (TextUtils.isEmpty(photoUri)) {
      val rawPhotoURI = cursor.getString(cursor.getColumnIndex(EXColumns.PHOTO_THUMBNAIL_URI))
      if (!TextUtils.isEmpty(rawPhotoURI)) {
        hasPhoto = true
        photoUri = rawPhotoURI
      }
    }

    // this.isMe = cursor.getInt(cursor.getColumnIndex(EXColumns.IS_PRIMARY)) == 1;

    when (mimeType) {
      StructuredName.CONTENT_ITEM_TYPE -> {
        lookupKey = cursor.getString(cursor.getColumnIndex(StructuredName.LOOKUP_KEY))
        firstName = cursor.getString(cursor.getColumnIndex(StructuredName.GIVEN_NAME))
        middleName = cursor.getString(cursor.getColumnIndex(StructuredName.MIDDLE_NAME))
        lastName = cursor.getString(cursor.getColumnIndex(StructuredName.FAMILY_NAME))
        prefix = cursor.getString(cursor.getColumnIndex(StructuredName.PREFIX))
        suffix = cursor.getString(cursor.getColumnIndex(StructuredName.SUFFIX))
        phoneticFirstName = cursor.getString(cursor.getColumnIndex(StructuredName.PHONETIC_GIVEN_NAME))
        phoneticMiddleName = cursor.getString(cursor.getColumnIndex(StructuredName.PHONETIC_MIDDLE_NAME))
        phoneticLastName = cursor.getString(cursor.getColumnIndex(StructuredName.PHONETIC_FAMILY_NAME))
      }
      CommonDataKinds.Organization.CONTENT_ITEM_TYPE -> {
        company = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.COMPANY))
        jobTitle = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.TITLE))
        department = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Organization.DEPARTMENT))
      }
      CommonDataKinds.Note.CONTENT_ITEM_TYPE -> {
        note = cursor.getString(cursor.getColumnIndex(CommonDataKinds.Note.NOTE))
      }
      CommonDataKinds.Event.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = DateModel().also { fromCursor(cursor) }
        dates.add(item)
      }
      CommonDataKinds.Email.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = EmailModel().also { fromCursor(cursor) }
        emails.add(item)
      }
      CommonDataKinds.Im.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = ImAddressModel().also { fromCursor(cursor) }
        imAddresses.add(item)
      }
      CommonDataKinds.Phone.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = PhoneNumberModel().also { fromCursor(cursor) }
        phones.add(item)
      }
      CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = PostalAddressModel().also { fromCursor(cursor) }
        addresses.add(item)
      }
      CommonDataKinds.Relation.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = RelationshipModel().also { fromCursor(cursor) }
        relationships.add(item)
      }
      CommonDataKinds.Website.CONTENT_ITEM_TYPE -> {
        val urlAddressModel: BaseModel = UrlAddressModel().also { fromCursor(cursor) }
        urlAddresses.add(urlAddressModel)
      }
      CommonDataKinds.Nickname.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = ExtraNameModel().also { fromCursor(cursor) }
        extraNames.add(item)
      }
    }

    val hasCompanyName = company != null && company != ""

    contactType = if (hasCompanyName) {
      val hasFirstName = firstName != null && firstName != ""
      val hasMiddleName = middleName != null && middleName != ""
      val hasLastName = lastName != null && lastName != ""
      if (!hasFirstName && !hasMiddleName && !hasLastName) {
        "company"
      } else {
        "person"
      }
    } else {
      "person"
    }
  }

  fun firstName() = firstName ?: (displayName ?: "")

  fun lastName() = lastName ?: (displayName ?: "")

  fun displayName() =
    if (displayName == null && firstName != null) {
      if (lastName == null) firstName
      else String.format("%s %s", firstName, lastName).trim { it <= ' ' }
    } else displayName

  fun toByteArray(bitmap: Bitmap): ByteArray {
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
    return stream.toByteArray()
  }

  fun toInsertOperationList(): ArrayList<ContentProviderOperation> {
    val ops = ArrayList<ContentProviderOperation>()
    var op = ContentProviderOperation.newInsert(RawContacts.CONTENT_URI)
      .withValue(RawContacts.ACCOUNT_TYPE, null)
      .withValue(RawContacts.ACCOUNT_NAME, null)
    ops.add(op.build())

    op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
      .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      .withValue(ContactsContract.Data.MIMETYPE, StructuredName.CONTENT_ITEM_TYPE)
      .withValue(StructuredName.DISPLAY_NAME, displayName)
      .withValue(StructuredName.GIVEN_NAME, firstName)
      .withValue(StructuredName.MIDDLE_NAME, middleName)
      .withValue(StructuredName.FAMILY_NAME, lastName)
      .withValue(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
      .withValue(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
      .withValue(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      .withValue(StructuredName.PREFIX, prefix)
      .withValue(StructuredName.SUFFIX, suffix)
    ops.add(op.build())

    op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
      .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      .withValue(EXColumns.MIMETYPE, CommonDataKinds.Organization.CONTENT_ITEM_TYPE)
      .withValue(CommonDataKinds.Organization.COMPANY, company)
      .withValue(CommonDataKinds.Organization.TITLE, jobTitle)
      .withValue(CommonDataKinds.Organization.DEPARTMENT, department)
    ops.add(op.build())

    op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
      .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      .withValue(EXColumns.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE)
      .withValue(CommonDataKinds.Note.NOTE, note)
    ops.add(op.build())

    op.withYieldAllowed(true)

    if (!TextUtils.isEmpty(photoUri) || !TextUtils.isEmpty(rawPhotoUri)) {
      val photo = getThumbnailBitmap(if (TextUtils.isEmpty(rawPhotoUri)) photoUri else rawPhotoUri)
      if (photo != null) {
        ops.add(
          ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
            .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
            .withValue(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
            .withValue(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
            .build()
        )
      }
    }
    // TODO: `addAll` or refractor this somehow
    baseModels
      .filterNotNull()
      .forEach { map ->
        map.forEach { item ->
          ops.add(item.insertOperation)
        }
      }
    return ops
  }

  fun toUpdateOperationList(): ArrayList<ContentProviderOperation?> {
    val selection = String.format("%s=? AND %s=?", ContactsContract.Data.CONTACT_ID, ContactsContract.Data.MIMETYPE)
    val selectionArgs = arrayOf(contactId, StructuredName.CONTENT_ITEM_TYPE)
    val ops = arrayListOf<ContentProviderOperation?>()
    var op: ContentProviderOperation.Builder
    op = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
      .withSelection(selection, selectionArgs)
      .withValue(StructuredName.DISPLAY_NAME, displayName)
      .withValue(StructuredName.GIVEN_NAME, firstName)
      .withValue(StructuredName.MIDDLE_NAME, middleName)
      .withValue(StructuredName.FAMILY_NAME, lastName)
      .withValue(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
      .withValue(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
      .withValue(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      .withValue(StructuredName.PREFIX, prefix).withValue(StructuredName.SUFFIX, suffix)
    ops.add(op.build())

    op = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
      .withSelection(selection, selectionArgs)
      .withValue(CommonDataKinds.Organization.COMPANY, company)
      .withValue(CommonDataKinds.Organization.TITLE, jobTitle)
      .withValue(CommonDataKinds.Organization.DEPARTMENT, department)
    ops.add(op.build())

    op = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
      .withSelection(selection, arrayOf(contactId, CommonDataKinds.Note.CONTENT_ITEM_TYPE))
      .withValue(CommonDataKinds.Note.NOTE, note)
    ops.add(op.build())

    op.withYieldAllowed(true)

    if (!TextUtils.isEmpty(photoUri) || !TextUtils.isEmpty(rawPhotoUri)) {
      val photo = getThumbnailBitmap(if (TextUtils.isEmpty(rawPhotoUri)) photoUri else rawPhotoUri)
      if (photo != null) {
        ops.add(
          ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
            .withSelection(selection, arrayOf(rawContactId, CommonDataKinds.Photo.CONTENT_ITEM_TYPE))
            .build()
        )
        ops.add(
          ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
            .withValue(ContactsContract.Data.RAW_CONTACT_ID, rawContactId)
            .withValue(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
            .withValue(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
            .build()
        )
      }
    }

    // TODO: refractor this (maybe for-loop looks better)
    baseModels
      .filterNotNull()
      .forEach { map ->
        map.forEach { item ->
          ops.add(item.getDeleteOperation(rawContactId))
          ops.add(item.getInsertOperation(rawContactId))
        }
      }
//    for (map in baseModels) {
//      if (map != null) {
//        for (item in map) {
//          ops.add(item.getDeleteOperation(rawContactId))
//          ops.add(item.getInsertOperation(rawContactId))
//        }
//      }
//    }
    return ops
  }

  val baseModels: List<MutableList<BaseModel>>
    get() = listOf(dates, emails, imAddresses, phones, addresses, relationships, urlAddresses, extraNames)

  // convert to react native object
  @Throws(ParseException::class)
  fun toMap(fieldSet: Set<String?>): Bundle {
    val contact = Bundle().apply {
      putBoolean("imageAvailable", hasPhoto)
      putString("lookupKey", lookupKey)
      putString("id", contactId)
      putString("name", if (!TextUtils.isEmpty(displayName)) displayName else "$firstName $lastName")
      putString("contactType", contactType)
    }

    if (!TextUtils.isEmpty(firstName)) contact.putString("firstName", firstName)
    if (!TextUtils.isEmpty(middleName)) contact.putString("middleName", middleName)
    if (!TextUtils.isEmpty(lastName)) contact.putString("lastName", lastName)
    if (!TextUtils.isEmpty(suffix)) contact.putString("nameSuffix", suffix)
    if (!TextUtils.isEmpty(prefix)) contact.putString("namePrefix", prefix)
    if (!TextUtils.isEmpty(phoneticFirstName)) contact.putString("phoneticFirstName", phoneticFirstName)
    if (!TextUtils.isEmpty(phoneticLastName)) contact.putString("phoneticLastName", phoneticLastName)
    if (!TextUtils.isEmpty(phoneticMiddleName)) contact.putString("phoneticMiddleName", phoneticMiddleName)
    if (!TextUtils.isEmpty(company)) contact.putString("company", company)
    if (!TextUtils.isEmpty(jobTitle)) contact.putString("jobTitle", jobTitle)
    if (!TextUtils.isEmpty(department)) contact.putString("department", department)

    if ("image" in fieldSet && photoUri != null) {
      val image = Bundle().apply { putString("uri", photoUri) }
      contact.putBundle("image", image)
    }
    if ("rawImage" in fieldSet && rawPhotoUri != null) {
      val image = Bundle().apply { putString("uri", rawPhotoUri) }
      contact.putBundle("image", image)
    }
    if ("note" in fieldSet && !TextUtils.isEmpty(note)) contact.putString("note", note)
    if ("phoneNumbers" in fieldSet && phones.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in phones) items.add(item.map)
      contact.putParcelableArrayList("phoneNumbers", items)
    }
    if ("emails" in fieldSet && emails.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in emails) items.add(item.map)
      contact.putParcelableArrayList("emails", items)
    }
    if ("addresses" in fieldSet && addresses.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in addresses) items.add(item.map)
      contact.putParcelableArrayList("addresses", items)
    }
    if ("instantMessageAddresses" in fieldSet && imAddresses.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in imAddresses) items.add(item.map)
      contact.putParcelableArrayList("instantMessageAddresses", items)
    }
    if ("urlAddresses" in fieldSet && urlAddresses.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in urlAddresses) items.add(item.map)
      contact.putParcelableArrayList("urlAddresses", items)
    }
    if ("relationships" in fieldSet && relationships.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in relationships) items.add(item.map)
      contact.putParcelableArrayList("relationships", items)
    }
    if (extraNames.isNotEmpty()) {
      val showNickname = fieldSet.contains("nickname")
      val showMaidenName = fieldSet.contains("maidenName")
      for (i in extraNames.indices) {
        val item = extraNames[i] as ExtraNameModel
        val data = item.data
        val label = item.label
        if (showMaidenName && label != null && label == "maidenName") {
          if (!TextUtils.isEmpty(data)) contact.putString(label, data)
        }
        if (showNickname && label != null && label == "nickname") {
          if (!TextUtils.isEmpty(data)) contact.putString(label, data)
        }
      }
      // WritableArray items = Arguments.createArray();
      // items.pushMap(item.getMap());
      // contact.putArray("extraNames", items);
    }
    val showBirthday = "birthday" in fieldSet
    val showDates = "dates" in fieldSet
    if (showDates || showBirthday) { // double if check with query with cursor
      var hasYear: Boolean
      val rawDatesArray = arrayListOf<Bundle?>()
      val datesArray = arrayListOf<Bundle?>()
      for (item in dates) {
        val calendar = Calendar.getInstance()
        val datePattern = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val noYearPattern = SimpleDateFormat("--MM-dd", Locale.getDefault())
        val details = Bundle()
        val dateString = item.data
        val label = item.label
        val rawDate = Bundle().apply {
          putString("type", label)
          putString("value", dateString)
        }
        rawDatesArray.add(rawDate)
        try {
          hasYear = !dateString.startsWith("--")
          if (hasYear) {
            calendar.time = datePattern.parse(dateString) as Date
          } else {
            calendar.time = noYearPattern.parse(dateString) as Date
          }
          if (hasYear) {
            details.putInt("year", calendar[Calendar.YEAR])
          }
          details.putInt("month", calendar[Calendar.MONTH])
          details.putInt("day", calendar[Calendar.DAY_OF_MONTH])
          // TODO: Evan: The type is only supported in 26+
          details.putString("format", "gregorian")
          if (showBirthday && label != null && label == "birthday") {
            contact.putBundle("birthday", details)
          } else {
            details.putString("label", label)
            datesArray.add(details)
          }
        } catch (e: Exception) {
          Log.w("Contact", e.toString())
        }
      }
      if (showDates) {
        if (datesArray.size > 0) {
          contact.putParcelableArrayList("dates", datesArray)
        }
      }
      if (rawDatesArray.size > 0) {
        contact.putParcelableArrayList("rawDates", rawDatesArray)
      }
    }
    return contact
  }

  val contentValues: ArrayList<ContentValues>
    get() {
      val contactData = ArrayList<ContentValues>()
      val name = ContentValues().apply {
        put(ContactsContract.Contacts.Data.MIMETYPE, CommonDataKinds.Identity.CONTENT_ITEM_TYPE)
        put(StructuredName.GIVEN_NAME, firstName)
        put(StructuredName.MIDDLE_NAME, middleName)
        put(StructuredName.FAMILY_NAME, lastName)
        put(StructuredName.PREFIX, prefix)
        put(StructuredName.SUFFIX, suffix)
        put(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
        put(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
        put(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      }
      contactData.add(name)
      val organization = ContentValues().apply {
        put(ContactsContract.Data.MIMETYPE, CommonDataKinds.Organization.CONTENT_ITEM_TYPE)
        put(CommonDataKinds.Organization.COMPANY, company)
        put(CommonDataKinds.Organization.TITLE, jobTitle)
        put(CommonDataKinds.Organization.DEPARTMENT, department)
      }
      contactData.add(organization)
      val notes = ContentValues().apply {
        put(ContactsContract.Data.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE)
        put(CommonDataKinds.Note.NOTE, note)
      }
      contactData.add(notes)
      if (photoUri != null && photoUri!!.isNotEmpty()) {
        val photo = getThumbnailBitmap(Uri.parse(photoUri).path)
        if (photo != null) {
          val image = ContentValues().apply {
            put(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
            put(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
          }
          contactData.add(image)
        }
      }
      if (rawPhotoUri != null && rawPhotoUri!!.isNotEmpty()) {
        val photo = getThumbnailBitmap(rawPhotoUri)
        if (photo != null) {
          val image = ContentValues().apply {
            put(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
            put(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
          }
          contactData.add(image)
        }
      }
      baseModels.filterNotNull().forEach { map ->
        map.forEach { item ->
          contactData.add(item.contentValues)
        }
      }
      return contactData
    }

  private fun getThumbnailBitmap(photoUri: String?): Bitmap =
    BitmapFactory.decodeFile(Uri.parse(photoUri).path)
}
