export default function (name: string, version: number, hashfunc: (bytes: number[] | string) => number[]): {
    (value: number[] | string, namespace: number[] | string, buf?: number[], offset?: number): string;
    name: string;
    DNS: string;
    URL: string;
};
//# sourceMappingURL=v35.d.ts.map