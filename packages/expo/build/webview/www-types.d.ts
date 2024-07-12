export type JSONValue = boolean | number | string | null | JSONArray | JSONObject;
export interface JSONArray extends Array<JSONValue> {
}
export interface JSONObject {
    [key: string]: JSONValue | undefined;
}
export type BridgeMessage<TData extends JSONValue> = {
    type: string;
    data: TData;
};
//# sourceMappingURL=www-types.d.ts.map