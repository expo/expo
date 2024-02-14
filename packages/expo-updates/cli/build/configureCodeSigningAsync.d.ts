type Options = {
    certificateInput: string;
    keyInput: string;
    keyid: string | undefined;
};
export declare function configureCodeSigningAsync(projectRoot: string, { certificateInput, keyInput, keyid }: Options): Promise<void>;
export {};
