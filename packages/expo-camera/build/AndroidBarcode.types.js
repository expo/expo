// //    when (barcode.valueType) {
//   Barcode.TYPE_CONTACT_INFO -> {
//     val info = barcode.contactInfo
//     result.apply {
//       putString("type", "contactInfo")
//       putString("firstName", info?.name?.first)
//       putString("middleName", info?.name?.middle)
//       putString("lastName", info?.name?.last)
//       putString("title", info?.title)
//       putString("organization", info?.organization)
//       putString("email", info?.emails?.firstOrNull()?.address)
//       putString("phone", info?.phones?.firstOrNull()?.number)
//       putString("url", info?.urls?.firstOrNull())
//       putString("address", info?.addresses?.firstOrNull()?.addressLines?.firstOrNull())
//     }
//   }
export {};
//# sourceMappingURL=AndroidBarcode.types.js.map