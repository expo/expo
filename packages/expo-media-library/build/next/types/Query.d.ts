import { Album } from './Album';
import { Asset } from './Asset';
import { AssetField, AssetFieldValueMap } from './AssetField';
import { SortDescriptor } from './SortDescriptor';
/**
 * Represents a query to fetch data from the media library.
 *
 * A `query` implements a builder pattern, allowing you to chain multiple filtering and sorting methods
 * to construct complex queries.
 */
export declare class Query {
    constructor();
    /**
     * Filters assets where the specified field is equal to the given value.
     * @param field - an {@link AssetField} to filter by.
     * @param value - The value that the field should equal. Each field has a specific unique type.
     * @returns The updated query object for chaining.
     */
    eq<T extends AssetField>(field: T, value: AssetFieldValueMap[T]): Query;
    /**
     * Filters assets where the specified field's value is in the given array of values.
     * @param field - an {@link AssetField} to filter by.
     * @param value - An array of values that the field should match. Each field has a specific unique type.
     * @returns The updated query object for chaining.
     */
    within<T extends AssetField>(field: T, value: AssetFieldValueMap[T][]): Query;
    /**
     * Filters assets where the specified field is greater than the given value.
     * @param field - an {@link AssetField} to filter by.
     * @param value - The value that the field should be greater than.
     * @returns The updated query object for chaining.
     */
    gt(field: AssetField, value: number): Query;
    /**
     * Filters assets where the specified field is greater than or equal to the given value.
     * @param field - an {@link AssetField} to filter by.
     * @param value - The value that the field should be greater than or equal to.
     */
    gte(field: AssetField, value: number): Query;
    /**
     * Filters assets where the specified field is less than the given value.
     * @param field - an {@link AssetField} to filter by.
     * @param value - The value that the field should be less than.
     * @returns The updated query object for chaining.
     */
    lt(field: AssetField, value: number): Query;
    /**
     * Filters assets where the specified field is less than or equal to the given value.
     * @param field - an {@link AssetField} to filter by.
     * @param value - The value that the field should be less than or equal to.
     * @returns The updated query object for chaining.
     */
    lte(field: AssetField, value: number): Query;
    /**
     * Limits the number of results returned by the query.
     * @param limit - The maximum number of results to return.
     * @returns The updated query object for chaining.
     */
    limit(limit: number): Query;
    /**
     * Skips the specified number of results.
     * @param offset - The number of results to skip.
     * @returns The updated query object for chaining.
     */
    offset(offset: number): Query;
    /**
     * Orders the results by the specified sort descriptor or asset field.
     * @param sortDescriptors - An instance of SortDescriptor or an AssetField. If an AssetField is provided, the sorting will be done in ascending order by default.
     */
    orderBy(sortDescriptors: SortDescriptor | AssetField): Query;
    /**
     * Filters assets to only those contained in the specified album.
     * @param album - The album to filter assets by.
     * @returns The updated query object for chaining.
     */
    album(album: Album): Query;
    /**
     * Executes the query and retrieves the matching assets.
     * @returns A promise that resolves to an array of {@link Asset} objects that match the query criteria.
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
    exe(): Promise<Asset[]>;
}
//# sourceMappingURL=Query.d.ts.map