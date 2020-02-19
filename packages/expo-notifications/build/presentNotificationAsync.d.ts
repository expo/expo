import { BaseNotificationRequest, IosNotificationRequestOptions as IosRequestOptions, AndroidNotificationRequestOptions as AndroidRequestOptions } from './NotificationPresenter.types';
interface EasyBodyBaseNotificationRequest extends Omit<BaseNotificationRequest, 'body'> {
    body?: {
        [key: string]: any;
    };
}
declare type IosNotificationRequest = Partial<EasyBodyBaseNotificationRequest> & IosRequestOptions;
declare type AndroidNotificationRequest = Partial<EasyBodyBaseNotificationRequest> & AndroidRequestOptions;
export declare type NotificationRequest = EasyBodyBaseNotificationRequest & {
    identifier?: string;
    ios?: IosNotificationRequest;
    android?: AndroidNotificationRequest;
};
export default function presentNotificationAsync({ identifier, ...notification }: NotificationRequest): Promise<void>;
export {};
