import { ModPlatform } from '@expo/config-plugins';
export type Workflow = 'managed' | 'generic';
export declare function resolveWorkflowAsync(projectDir: string, platform: ModPlatform): Promise<Workflow>;
export declare function validateWorkflow(possibleWorkflow: string): Workflow;
