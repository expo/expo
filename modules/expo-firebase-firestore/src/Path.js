/**
 * @flow
 * Path representation wrapper
 */

/**
 * @class Path
 */
export default class Path {
  _parts: string[];

  constructor(pathComponents: string[]) {
    this._parts = pathComponents;
  }

  get id(): string | null {
    return this._parts.length ? this._parts[this._parts.length - 1] : null;
  }

  get isDocument(): boolean {
    return this._parts.length % 2 === 0;
  }

  get isCollection(): boolean {
    return this._parts.length % 2 === 1;
  }

  get relativeName(): string {
    return this._parts.join('/');
  }

  child(relativePath: string): Path {
    return new Path(this._parts.concat(relativePath.split('/')));
  }

  parent(): Path | null {
    return this._parts.length > 1 ? new Path(this._parts.slice(0, this._parts.length - 1)) : null;
  }

  /**
   *
   * @package
   */
  static fromName(name: string): Path {
    if (!name) return new Path([]);
    const parts = name.split('/');
    return new Path(parts);
  }
}
