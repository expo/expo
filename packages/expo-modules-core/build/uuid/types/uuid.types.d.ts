export type OutputBuffer = ArrayLike<number>;
export type InputBuffer = ArrayLike<number>;
export type V4Options = {
    random: InputBuffer;
} | {
    rng(): InputBuffer;
} | string;
export type v4String = (options?: V4Options) => string;
export type v4Buffer = <T extends OutputBuffer>(options: V4Options | null | undefined, buffer: T, offset?: number) => T;
export type v4 = v4Buffer & v4String;
export declare enum Uuidv5Namespace {
    dns = "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    url = "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
    oid = "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
    x500 = "6ba7b814-9dad-11d1-80b4-00c04fd430c8"
}
//# sourceMappingURL=uuid.types.d.ts.map