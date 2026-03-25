export declare function checkSerializable(o: {
    [key: string]: any;
}): {
    serializable: true;
} | {
    serializable: false;
    location: (string | number)[];
    reason: string;
};
//# sourceMappingURL=checkSerializable.d.ts.map