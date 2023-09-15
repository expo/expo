import { getActionFromState } from '@react-navigation/native';
export type NavigateAction = Extract<ReturnType<typeof getActionFromState>, {
    type: 'NAVIGATE';
}> & {
    payload: NavigateActionParams;
};
export type NavigateActionParams = {
    params?: NavigateActionParams;
    path: string;
    initial: boolean;
    screen: string;
    name?: string;
};
//# sourceMappingURL=stateOperations.d.ts.map