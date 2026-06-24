import { Asset, type Album } from './AssetAlbum';
import { NativeAlbum, NativeQuery } from '../native';
import type { AssetField, AssetFieldValueMap, AssetMetadata, SortDescriptor } from '../types';

/**
 * Represents a query to fetch data from the media library.
 *
 * A `query` implements a builder pattern, allowing you to chain multiple filtering and sorting methods
 * to construct complex queries.
 */
export class Query {
  private readonly nativeQuery: InstanceType<typeof NativeQuery>;

  constructor() {
    this.nativeQuery = new NativeQuery();
  }

  /**
   * Filters assets where the specified field is equal to the given value.
   * @param field - an [`AssetField`](#assetfield) to filter by.
   * @param value - The value that the field should equal. Each field has a specific unique type.
   * @returns The updated query object for chaining.
   */
  eq<T extends AssetField>(field: T, value: AssetFieldValueMap[T]): Query {
    this.nativeQuery.eq(field, value);
    return this;
  }

  /**
   * Filters assets where the specified field's value is in the given array of values.
   * @param field - an [`AssetField`](#assetfield) to filter by.
   * @param value - An array of values that the field should match. Each field has a specific unique type.
   * @returns The updated query object for chaining.
   */
  within<T extends AssetField>(field: T, value: AssetFieldValueMap[T][]): Query {
    this.nativeQuery.within(field, value);
    return this;
  }

  /**
   * Filters assets where the specified field is greater than the given value.
   * @param field - an [`AssetField`](#assetfield) to filter by.
   * @param value - The value that the field should be greater than.
   * @returns The updated query object for chaining.
   */
  gt(field: AssetField, value: number): Query {
    this.nativeQuery.gt(field, value);
    return this;
  }

  /**
   * Filters assets where the specified field is greater than or equal to the given value.
   * @param field - an [`AssetField`](#assetfield) to filter by.
   * @param value - The value that the field should be greater than or equal to.
   * @returns The updated query object for chaining.
   */
  gte(field: AssetField, value: number): Query {
    this.nativeQuery.gte(field, value);
    return this;
  }

  /**
   * Filters assets where the specified field is less than the given value.
   * @param field - an [`AssetField`](#assetfield) to filter by.
   * @param value - The value that the field should be less than.
   * @returns The updated query object for chaining.
   */
  lt(field: AssetField, value: number): Query {
    this.nativeQuery.lt(field, value);
    return this;
  }

  /**
   * Filters assets where the specified field is less than or equal to the given value.
   * @param field - an [`AssetField`](#assetfield) to filter by.
   * @param value - The value that the field should be less than or equal to.
   * @returns The updated query object for chaining.
   */
  lte(field: AssetField, value: number): Query {
    this.nativeQuery.lte(field, value);
    return this;
  }

  /**
   * Limits the number of results returned by the query.
   * @param limit - The maximum number of results to return.
   * @returns The updated query object for chaining.
   */
  limit(limit: number): Query {
    this.nativeQuery.limit(limit);
    return this;
  }

  /**
   * Skips the specified number of results.
   * @param offset - The number of results to skip.
   * @returns The updated query object for chaining.
   */
  offset(offset: number): Query {
    this.nativeQuery.offset(offset);
    return this;
  }

  /**
   * Orders the results by the specified sort descriptor or asset field.
   * @param sortDescriptors - An instance of SortDescriptor or an AssetField. If an AssetField is provided, the sorting will be done in ascending order by default.
   * @returns The updated query object for chaining.
   */
  orderBy(sortDescriptors: SortDescriptor | AssetField): Query {
    this.nativeQuery.orderBy(sortDescriptors);
    return this;
  }

  /**
   * Filters assets to only those contained in the specified album.
   * @param album - The album to filter assets by.
   * @returns The updated query object for chaining.
   */
  album(album: Album): Query {
    this.nativeQuery.album(new NativeAlbum(album.id));
    return this;
  }

  /**
   * Executes the query and retrieves the matching assets.
   * @returns A promise that resolves to an array of [`Asset`](#asset) objects that match the query criteria.
   *
   * @example
   * ```ts
   * const assets = await new Query()
   *  .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
   *  .lte(AssetField.HEIGHT, 1080)
   *  .orderBy(AssetField.CREATION_TIME)
   *  .limit(20)
   *  .exe();
   * ```
   */
  async exe(): Promise<Asset[]> {
    const natives = await this.nativeQuery.exe();
    return natives.map((a) => new Asset(a.id));
  }

  /**
   * Executes the query and retrieves lightweight metadata for the matching assets.
   *
   * Returns fields that can be read cheaply from the media store, without resolving file paths or
   * decoding files.
   *
   * @returns A promise that resolves to an array of [`AssetMetadata`](#assetmetadata) objects that match the query criteria.
   *
   * @example
   * ```ts
   * const assets = await new Query()
   *  .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
   *  .lte(AssetField.HEIGHT, 1080)
   *  .orderBy(AssetField.CREATION_TIME)
   *  .limit(20)
   *  .exeForMetadata();
   * ```
   */
  exeForMetadata(): Promise<AssetMetadata[]> {
    return this.nativeQuery.exeForMetadata();
  }
}
