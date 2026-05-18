import Runner from 'jscodeshift/src/Runner';
export type ParserKind = 'tsx' | 'jsx' | 'ts';
export declare function runTransformAsync({ files, parser, transform, }: {
    files: string[];
    parser: ParserKind;
    transform: string;
}): ReturnType<(typeof Runner)['run']>;
