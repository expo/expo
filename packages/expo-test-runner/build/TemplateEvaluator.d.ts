import { Definitions } from 'dot';
export default class TemplateEvaluator {
    private definitions;
    constructor(definitions: Definitions);
    compileFileAsync(path: string): Promise<void>;
}
