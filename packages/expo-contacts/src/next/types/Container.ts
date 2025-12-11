import { Contact } from './Contact';
import { Group } from './Group';

/**
 * Represents the account type of a container.
 */
export type ContainerType = 'local' | 'exchange' | 'cardDAV' | 'unassigned' | 'unknown';

export declare class Container {
  /**
   * Constructor for Container instance.
   * While you can instantiate this class directly if you have an ID, the recommended way to obtain a `Container` instance
   * is to use static methods like `Container.getAll` or `Container.getDefault`.
   *
   * @param id - The unique identifier of the container.
   * @platform ios
   */
  constructor(id: string);

  /**
   * The unique identifier for the container.
   * @platform ios
   */
  readonly id: string;

  /**
   * Retrieves the name of the container.
   * @returns A promise resolving to the container name string (e.g., "iCloud", "Gmail") or `null` if not available.
   * @platform ios
   * @example
   * ```ts
   * const name = await container.getName(); // 'iCloud'
   * ```
   */
  getName(): Promise<string | null>;

  /**
   * Retrieves the type of the container.
   * @returns A promise resolving to the {@link ContainerType} (e.g., 'cardDAV', 'exchange') or `null`.
   * @platform ios
   * @example
   * ```ts
   * const type = await container.getType(); // 'cardDAV'
   * ```
   */
  getType(): Promise<ContainerType | null>;

  /**
   * Retrieves all groups associated with this container.
   * @returns A promise resolving to an array of {@link Group} instances within this container.
   * @platform ios
   * @example
   * ```ts
   * const groups = await container.getGroups();
   * ```
   */
  getGroups(): Promise<Group[]>;

  /**
   * Retrieves all contacts stored in this container.
   * @returns A promise resolving to an array of {@link Contact} instances within this container.
   * @platform ios
   * @example
   * ```ts
   * const contacts = await container.getContacts();
   * ```
   */
  getContacts(): Promise<Contact[]>;

  /**
   * A static method that retrieves all contact containers available on the device.
   * @returns A promise resolving to an array of {@link Container} instances.
   * @platform ios
   * @example
   * ```ts
   * const containers = await Container.getAll();
   * ```
   */
  static getAll(): Promise<Container[]>;

  /**
   * A static method that retrieves the default container.
   * The default container is where new contacts are added if no specific container is specified.
   * @returns A promise resolving to the default {@link Container} instance or `null` if not found.
   * @platform ios
   * @example
   * ```ts
   * const defaultContainer = await Container.getDefault();
   * ```
   */
  static getDefault(): Promise<Container | null>;
}

// @hidden
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
