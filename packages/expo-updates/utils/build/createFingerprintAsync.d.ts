import * as Fingerprint from '@expo/fingerprint';
import { Workflow } from './workflow';
export declare function createFingerprintAsync(projectRoot: string, platform: 'ios' | 'android', workflow: Workflow, options: Fingerprint.Options): Promise<Fingerprint.Fingerprint>;
