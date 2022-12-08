import React from 'react';
type Props = {
    selectedModules: {
        test: any;
    }[];
};
type State = {
    portalChildShouldBeVisible: boolean;
    state: any;
    testPortal: React.ReactElement<any> | null;
    numFailed: number;
    done: boolean;
    testRunnerError?: null;
    results?: any;
};
export default class TestScreen extends React.Component<Props, State> {
    state: State;
    _results: string;
    _failures: string;
    _scrollViewRef: null;
    _isMounted: boolean | null;
    componentDidMount(): void;
    componentWillUnmount(): void;
    setPortalChild: (testPortal: any) => void;
    cleanupPortal: () => Promise<void>;
    _runTests: (modules: any) => Promise<void>;
    _setupJasmine(): Promise<{
        jasmineCore: any;
        jasmineEnv: any;
        jasmine: any;
    }>;
    _jasmineConsoleReporter(): {
        specDone(result: any): void;
        jasmineStarted(): void;
        jasmineDone(): void;
    };
    _jasmineSetStateReporter(): {
        suiteStarted(jasmineResult: any): void;
        suiteDone(): void;
        specStarted(jasmineResult: any): void;
        specDone(jasmineResult: any): void;
    };
    render(): JSX.Element;
}
export { TestScreen as TestRunner };
//# sourceMappingURL=index.d.ts.map