// @flow

export default {
  async shareContactAsync(contactId: string, message: string) {},
  async getContactsAsync(contactQuery: Object) {},
  async addContactAsync(contact: Object, containerId: string) {},
  async updateContactAsync(contact: Object) {},
  async removeContactAsync(contactId: string) {},
  async writeContactToFileAsync(contactQuery: Object) {},
  async presentFormAsync(contactId: string, contact: Object, adjustedOptions: Object) {},
};
