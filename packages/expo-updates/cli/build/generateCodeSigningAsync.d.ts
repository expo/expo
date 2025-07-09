type Options = {
    certificateValidityDurationYears: number;
    keyOutput: string;
    certificateOutput: string;
    certificateCommonName: string;
};
export declare function generateCodeSigningAsync(projectRoot: string, { certificateValidityDurationYears, keyOutput, certificateOutput, certificateCommonName }: Options): Promise<void>;
export {};
