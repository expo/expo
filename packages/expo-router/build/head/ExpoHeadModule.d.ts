export type UserActivity = {
    id?: string | undefined;
    /**
     * The activity title should be clear and concise. This text describes the content of the link, like “Photo taken on July 27, 2020” or “Conversation with Maria”. Use nouns for activity titles.
     */
    title?: string | undefined;
    description?: string | undefined;
    webpageURL?: string | undefined;
    keywords?: string[] | undefined;
    activityType: string;
    phrase?: string | undefined;
    thumbnailURL?: string | undefined;
    userInfo?: Record<string, string> | undefined;
    isEligibleForHandoff?: boolean | undefined;
    isEligibleForPrediction?: boolean | undefined;
    isEligibleForSearch?: boolean | undefined;
    /** Local file path for an image */
    imageUrl?: string | undefined;
    darkImageUrl?: string | undefined;
    dateModified?: Date | undefined;
    expirationDate?: Date | undefined;
};
declare let ExpoHead: {
    activities: {
        INDEXED_ROUTE: string;
    };
    getLaunchActivity(): UserActivity;
    createActivity(userActivity: UserActivity): void;
    clearActivitiesAsync(ids: string[]): Promise<void>;
    suspendActivity(id: string): void;
    revokeActivity(id: string): void;
} | null;
export { ExpoHead };
//# sourceMappingURL=ExpoHeadModule.d.ts.map