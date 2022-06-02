/// <reference types="react" />
export declare type RootStackParamList = {
    ['Story Files']: undefined;
    ['Selected Stories']: {
        title: string;
        storyFileIds: string[];
    };
    ['Stories Detail']: {
        title: string;
        selectedStoryIds: string[];
    };
};
export declare type StoryConfig = {
    storyConfig: {
        id: string;
        name: string;
    };
    file: {
        id: string;
        title: string;
    };
};
export declare type File = {
    id: string;
    title: string;
    storyIds: string[];
};
export declare type Story = {
    id: string;
    name: string;
    file: {
        id: string;
        title: string;
    };
    component: React.FunctionComponent;
};
export declare type StoriesExport = Record<string, StoryConfig>;
//# sourceMappingURL=types.d.ts.map