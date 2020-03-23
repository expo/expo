import { ExpoRequestor } from './ExpoRequestor';
/**
 * Extends Requester
 */
export class ExpoTokenRequestor extends ExpoRequestor {
    // https://github.com/openid/AppAuth-iOS/blob/cf5b15a6e02ee509c5966c5dacbc45a0bef7c5cf/Source/OIDAuthorizationService.m#L429
    async xhr(settings) {
        return super.xhr(settings);
    }
}
//# sourceMappingURL=ExpoTokenRequestor.js.map