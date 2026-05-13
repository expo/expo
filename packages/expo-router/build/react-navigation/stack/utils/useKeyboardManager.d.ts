export declare function useKeyboardManager({ enabled, focused }: {
    enabled: boolean;
    focused: boolean;
}): {
    onPageChangeStart: () => void;
    onPageChangeConfirm: ({ gesture, active, closing }: {
        gesture: boolean;
        active: boolean;
        closing: boolean;
    }) => void;
    onPageChangeCancel: () => void;
};
//# sourceMappingURL=useKeyboardManager.d.ts.map