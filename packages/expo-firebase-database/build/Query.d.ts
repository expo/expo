import { DatabaseModifier } from './types';
declare type Reference = {
    [key: string]: any;
};
/**
 * @class Query
 */
export default class Query {
    _reference: Reference;
    modifiers: Array<DatabaseModifier>;
    constructor(ref: Reference, existingModifiers?: Array<DatabaseModifier>);
    /**
     *
     * @param name
     * @param key
     * @return {Reference|*}
     */
    orderBy(name: string, key?: string): Reference;
    /**
     *
     * @param name
     * @param limit
     * @return {Reference|*}
     */
    limit(name: string, limit: number): Reference;
    /**
     *
     * @param name
     * @param value
     * @param key
     * @return {Reference|*}
     */
    filter(name: string, value: any, key?: string): Reference;
    /**
     *
     * @return {[*]}
     */
    getModifiers(): DatabaseModifier[];
    /**
     *
     * @return {*}
     */
    queryIdentifier(): string;
}
export {};
