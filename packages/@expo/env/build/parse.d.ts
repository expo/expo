export interface EnvOutput {
    [name: string]: string | undefined;
}
export declare function parse<T extends EnvOutput = EnvOutput>(contents: string): T;
export declare function expand(inputEnv: EnvOutput, sourceEnv: EnvOutput): EnvOutput;
