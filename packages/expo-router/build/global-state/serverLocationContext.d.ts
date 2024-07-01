/// <reference types="react" />
export type ServerContextType = {
    location?: {
        pathname: string;
        search: string;
    };
};
declare const ServerContext: import("react").Context<ServerContextType | undefined>;
export default ServerContext;
//# sourceMappingURL=serverLocationContext.d.ts.map