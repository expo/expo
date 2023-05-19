import { MediaCondition, MediaQuery } from 'lightningcss';
import { ContainerRuntime, ExtractedContainerQuery, Interaction, PseudoClassesQuery, SignalLike } from '../../types';
interface ConditionReference {
    width: number | SignalLike<number>;
    height: number | SignalLike<number>;
}
/**
 * Test a media query against current conditions
 */
export declare function testMediaQuery(mediaQuery: MediaQuery, conditionReference?: ConditionReference): boolean;
export declare function testPseudoClasses(interaction: Interaction | undefined, meta: PseudoClassesQuery): boolean;
export declare function testContainerQuery(containerQuery: ExtractedContainerQuery[] | undefined, containers?: Record<string, ContainerRuntime>): boolean;
/**
 * Test a media condition against current conditions
 * This is also used for container queries
 */
export declare function testCondition(condition: MediaCondition | null | undefined, conditionReference: ConditionReference): boolean;
export {};
//# sourceMappingURL=conditions.d.ts.map