import { project, UUID } from 'xcode';
declare class PBXProject extends project {
    /**
     * @param filePath
     * @param param1.target PBXNativeTarget reference
     * @param param1.group PBXGroup reference
     */
    addStoryboardFile(filePath: string, { target, group }: {
        target: UUID;
        group: UUID;
    }): void;
}
export { PBXProject as project };
