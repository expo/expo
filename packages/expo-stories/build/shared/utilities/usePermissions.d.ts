export default function usePermissions(permissionRequester: () => Promise<{
    granted: boolean;
}>): [boolean];
