import * as React from 'react';
export type ServerContextType = {
    location?: {
        pathname: string;
        search: string;
    };
};
export declare const ServerContext: React.Context<ServerContextType | undefined>;
//# sourceMappingURL=ServerContext.d.ts.map