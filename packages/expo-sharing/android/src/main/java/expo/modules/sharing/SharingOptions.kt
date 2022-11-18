package expo.modules.sharing

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
// export type SharingOptions = {
//  /**
//   * Sets `mimeType` for `Intent`.
//   * @platform android
//   */
//  mimeType?: string;
//  /**
//   * [Uniform Type Identifier](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/understanding_utis/understand_utis_conc/understand_utis_conc.html)
//   *  - the type of the target file.
//   * @platform ios
//   */
//  UTI?: string;
//  /**
//   * Sets share dialog title.
//   * @platform android
//   * @platform web
//   */
//  dialogTitle?: string;
// };

data class SharingOptions(
  @Field val mimeType: String?,
  @Field val UTI: String?,
  @Field val dialogTitle: String?
) : Record
