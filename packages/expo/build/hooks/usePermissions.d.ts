export type PermissionStatus = {
    granted: boolean;
    canAskAgain: boolean;
};
export type Permission = {
    check: () => PermissionStatus;
    request: () => PermissionStatus;
};
export declare function usePermissions(permissions: Permission[] | Permission): {
    granted: boolean;
    request: () => Promise<boolean>;
    check: () => boolean;
};
//# sourceMappingURL=usePermissions.d.ts.map