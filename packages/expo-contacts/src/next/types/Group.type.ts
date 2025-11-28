import { Contact } from './Contact.type';
import { ContactQueryOptions } from './ContactProps.type';

export declare class Group {
  /**
   * Creates a new instance of a Group.
   * Note: Usually you obtain instances via `Group.create`, `Group.getAll` or `Group.getById`.
   * @param id The unique identifier of the group.
   */
  constructor(id: string);

  /**
   * The unique identifier of the group.
   */
  readonly id: string;

  /**
   * Gets the name of the group.
   * @returns A promise resolving to the group name.
   */
  getName(): Promise<string | null>;

  /**
   * Updates the name of the group.
   * @param name The new name for the group.
   * @returns A promise that resolves when the name has been updated.
   */
  setName(name: string): Promise<void>;

  /**
   * Adds a contact to the group.
   * @param contact The Contact object to add to this group.
   * @returns A promise that resolves when the contact has been added.
   */
  addContact(contact: Contact): Promise<void>;

  /**
   * Removes a contact from the group.
   * Note: This does not delete the contact from the device, only removes their membership from this group.
   * @param contact The Contact object to remove from this group.
   * @returns A promise that resolves when the contact has been removed.
   */
  removeContact(contact: Contact): Promise<void>;

  /**
   * Gets all contacts that are members of this group.
   * @returns A promise resolving to an array of Contact instances.
   */
  getContacts(options?: ContactQueryOptions): Promise<Contact[]>;

  /**
   * Deletes the group from the device.
   * Note: This does not delete the contacts contained within the group.
   * @returns A promise that resolves when the group has been deleted.
   */
  delete(): Promise<void>;

  /**
   * Creates a new group on the device.
   * @param name The name of the new group.
   * @param containerId (Optional) The container ID where the group should be created. If omitted, the default container is used.
   * @returns A promise resolving to the newly created Group instance.
   */
  static create(name: string, containerId?: string): Promise<Group>;

  /**
   * Retrieves all groups from the device.
   * @param containerId (Optional) If provided, fetches groups only from the specified container.
   * @returns A promise resolving to an array of Group instances.
   */
  static getAll(containerId?: string): Promise<Group[]>;
}

export class FallbackGroup {
  constructor(id: string) {
    this.id = id;
  }
  id: string;
  getName(): Promise<string | null> {
    throw new Error('Not implemented');
  }
  setName(name: string): Promise<void> {
    throw new Error('Not implemented');
  }
  addContact(contact: Contact): Promise<void> {
    throw new Error('Not implemented');
  }
  removeContact(contact: Contact): Promise<void> {
    throw new Error('Not implemented');
  }
  getContacts(): Promise<Contact[]> {
    throw new Error('Not implemented');
  }
  delete(): Promise<void> {
    throw new Error('Not implemented');
  }
  static create(name: string, containerId?: string): Promise<Group> {
    throw new Error('Not implemented');
  }
  static getAll(containerId?: string): Promise<Group[]> {
    throw new Error('Not implemented');
  }
}
