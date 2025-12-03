import { Contact } from './Contact';
import { Group } from './Group';

export type ContainerType = 'local' | 'exchange' | 'cardDAV' | 'unassigned' | 'unknown';

export declare class Container {
  constructor(id: string);
  readonly id: string;

  getName(): Promise<string | null>;
  getType(): Promise<ContainerType | null>;
  getGroups(): Promise<Group[]>;
  getContacts(): Promise<Contact[]>;

  static getAll(): Promise<Container[]>;
  static getDefault(): Promise<Container | null>;
}

export class FallbackContainer {
  constructor(id: string) {
    this.id = id;
  }
  readonly id: string;

  getName(): Promise<string | null> {
    throw new Error('Not implemented');
  }
  getType(): Promise<ContainerType | null> {
    throw new Error('Not implemented');
  }
  getGroups(): Promise<Group[]> {
    throw new Error('Not implemented');
  }
  getContacts(): Promise<Contact[]> {
    throw new Error('Not implemented');
  }
  static getAll(): Promise<Container[]> {
    throw new Error('Not implemented');
  }
  static getDefault(): Promise<Container | null> {
    throw new Error('Not implemented');
  }
}
