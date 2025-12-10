package expo.modules.contacts.next.mappers

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.ClearableField
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.contact.ContactPatch
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.records.NewRecord
import expo.modules.contacts.next.records.PatchRecord
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.ValueOrUndefined
import expo.modules.kotlin.types.toKClass
import kotlin.collections.orEmpty

class ContactPatchBuilder(
  val contactId: ContactId,
  val rawContactId: RawContactId,
  val mapper: ContactRecordDomainMapper
) {
  val modifiedFields = mutableSetOf<ClearableField>()
  val toUpdate = mutableListOf<Updatable>()
  val toAppend = mutableListOf<Appendable>()

  fun build() = ContactPatch(contactId, modifiedFields, toAppend, toUpdate)

  fun withUpdatable(updatable: Updatable) = apply {
    toUpdate.add(updatable)
  }

  fun withAppendable(appendable: Appendable) = apply {
    toAppend.add(appendable)
  }

  @OptIn(EitherType::class)
  inline fun <reified T : PatchRecord, reified R : NewRecord> withListProperty(
    property: ValueOrUndefined<List<Either<T, R>>?>,
    field: ClearableField
  ) = apply {
    if (property.isUndefined) {
      return@apply
    }
    if (property.optional == null) {
      return@apply
    }
    modifiedFields.add(field)
    property.optional
      .orEmpty()
      .partition { it.`is`(toKClass<T>()) }
      .let { (patches, appends) ->
        patches
          .map { it.get(toKClass<T>()) }
          .map { mapper.toPatchable(it) }
          .forEach { toUpdate.add(it) }
        appends
          .map { it.get(toKClass<R>()) }
          .map { mapper.toAppendable(record = it, rawContactId = rawContactId) }
          .forEach { toAppend.add(it) }
      }
  }
}
