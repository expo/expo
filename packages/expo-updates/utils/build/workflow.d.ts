export type Workflow = 'managed' | 'generic';
export declare function resolveWorkflowAsync(projectDir: string, platform: 'ios' | 'android'): Promise<Workflow>;
export declare function validateWorkflow(possibleWorkflow: string): Workflow;
