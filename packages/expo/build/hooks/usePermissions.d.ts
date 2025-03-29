export type Permission = {
  check: () => boolean;
  request: () => boolean;
};
export declare function usePermissions(permissions: Permission[] | Permission): {
  granted: boolean;
  request: () => void;
  check: () => void;
};
//# sourceMappingURL=usePermissions.d.ts.map
