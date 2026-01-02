import { Contact } from './Contact';
import { ContactQueryOptions } from './Contact.props';

export declare class Group {
  constructor(id: string);
  readonly id: string;

  getName(): Promise<string | null>;
  setName(name: string): Promise<void>;

  addContact(contact: Contact): Promise<void>;
  removeContact(contact: Contact): Promise<void>;
  getContacts(options?: ContactQueryOptions): Promise<Contact[]>;

  delete(): Promise<void>;

  static create(name: string, containerId?: string): Promise<Group>;
  static getAll(containerId?: string): Promise<Group[]>;
}

export class FallbackGroup {
  constructor(id: string) {
    this.id = id;
  }
  readonly id: string;

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
