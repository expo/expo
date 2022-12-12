/// <reference types="react" />
export type RootStackParamList = {
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
export type StoryConfig = {
    storyConfig: {
        id: string;
        name: string;
    };
    file: {
        id: string;
        title: string;
    };
};
export type File = {
    id: string;
    title: string;
    storyIds: string[];
};
export type Story = {
    id: string;
    name: string;
    file: {
        id: string;
        title: string;
    };
    component: React.FunctionComponent;
};
export type StoriesExport = Record<string, StoryConfig>;
//# sourceMappingURL=types.d.ts.map