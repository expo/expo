/**
 @file          BNCLocalization.m
 @package       Branch-SDK
 @brief         Branch string localizations.

 @author        Parth Kalavadia
 @date          July 2017
 @copyright     Copyright © 2017 Branch. All rights reserved.
*/

#import "BNCLocalization.h"
#import "BNCLog.h"

#pragma mark Convenience Functions

NSString* _Nonnull BNCLocalizedFormattedString(NSString* _Nonnull const format, ...) {
    NSString *string = @"";
    if (format) {
        va_list args;
        va_start(args, format);
        string = [[NSString alloc] initWithFormat:format arguments:args];
        va_end(args);
    }
    return string;
}

#pragma mark BNCLocalization

@interface BNCLocalization () {
    NSString     *_currentLanguage;
}
@end

@implementation BNCLocalization

+ (instancetype) shared {
    static BNCLocalization *bnc_shared = 0;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        bnc_shared = [[BNCLocalization alloc] init];
    });
    return bnc_shared;
}

+ (NSString*_Nonnull) applicationLanguage {
    NSString* lang = [[[NSBundle mainBundle] preferredLocalizations] firstObject];
    return lang ? lang : @"";
}

- (instancetype) init {
    self = [super init];
    if (!self) return self;
    self.currentLanguage = [self.class applicationLanguage];
    return self;
}

- (NSString*_Nonnull) currentLanguage {
    @synchronized (self) {
        return _currentLanguage;
    }
}

- (void) setCurrentLanguage:(NSString*)language {
    @synchronized (self) {

        if (!language.length) {
            language = [self.class applicationLanguage];
        }

        NSRange range =
            [language rangeOfCharacterFromSet:
                [[NSCharacterSet letterCharacterSet] invertedSet]];
        if (range.location != NSNotFound)
            language = [language substringToIndex:range.location];
        language = [language lowercaseString];

        _currentLanguageDictionary = self.class.languageDictionaries[language];
        if (_currentLanguageDictionary) {
            _currentLanguage = language.copy;
        } else {
            _currentLanguage = @"en";
            _currentLanguageDictionary = [BNCLocalization en_localized];
        }
    }
}

- (NSString*_Nonnull) localizeString:(NSString *)string {
    if (!string) return @"";

    NSString *localized = self.currentLanguageDictionary[string];
    if (localized) return localized;

    BNCLogWarning(
        @"Branch is missing the localization missing for language '%@' string '%@'.",
            self.currentLanguage, string);

    localized = self.class.languageDictionaries[@"en"][string];
    if (localized) return localized;

    return string;
}

+(NSDictionary<NSString*, NSDictionary*>*_Nonnull) languageDictionaries {
    NSDictionary* languages = @{
        @"en":  [BNCLocalization en_localized],
        @"ru":  [BNCLocalization ru_localized],
    };
    return languages;
}

+ (NSDictionary*_Nonnull) en_localized {
    NSDictionary* en_dict = @{

    // BNCInitError
    @"The Branch user session has not been initialized.":
    @"The Branch user session has not been initialized.",

    // BNCDuplicateResourceError
    @"A resource with this identifier already exists.":
    @"A resource with this identifier already exists.",

    // BNCRedeemCreditsError
    @"You're trying to redeem more credits than are available. Have you loaded rewards?":
    @"You're trying to redeem more credits than are available. Have you loaded rewards?",

    // BNCBadRequestError
    @"The network request was invalid.":
    @"The network request was invalid.",

    // BNCServerProblemError
    @"Trouble reaching the Branch servers, please try again shortly.":
    @"Trouble reaching the Branch servers, please try again shortly.",

    // BNCNilLogError
    @"Can't log error messages because the logger is set to nil.":
    @"Can't log error messages because the logger is set to nil.",

    // BNCVersionError
    @"Incompatible version.":
    @"Incompatible version.",

    // BNCNetworkServiceInterfaceError
    @"The underlying network service does not conform to the BNCNetworkOperationProtocol.":
    @"The underlying network service does not conform to the BNCNetworkOperationProtocol.",

    // BNCInvalidNetworkPublicKeyError
    @"Public key is not an SecKeyRef type.":
    @"Public key is not an SecKeyRef type.",

    // BNCContentIdentifierError
    @"A canonical identifier or title are required to uniquely identify content.":
    @"A canonical identifier or title are required to uniquely identify content.",

    // BNCSpotlightNotAvailableError
    @"The Core Spotlight indexing service is not available on this device.":
    @"The Core Spotlight indexing service is not available on this device.",

    // BNCSpotlightTitleError
    @"Spotlight indexing requires a title.":
    @"Spotlight indexing requires a title.",

    // BNCRedeemZeroCreditsError
    @"Can't redeem zero credits.":
    @"Can't redeem zero credits.",

    // Unknown error
    @"Branch encountered an error.":
    @"Branch encountered an error.",

    // Network provider error messages
    @"A network operation instance is expected to be returned by the networkOperationWithURLRequest:completion: method.":
    @"A network operation instance is expected to be returned by the networkOperationWithURLRequest:completion: method.",

    @"Network operation of class '%@' does not conform to the BNCNetworkOperationProtocol.":
    @"Network operation of class '%@' does not conform to the BNCNetworkOperationProtocol.",

    @"The network operation start date is not set. The Branch SDK expects the network operation start date to be set by the network provider.":
    @"The network operation start date is not set. The Branch SDK expects the network operation start date to be set by the network provider.",

    @"The network operation timeout date is not set. The Branch SDK expects the network operation timeout date to be set by the network provider.":
    @"The network operation timeout date is not set. The Branch SDK expects the network operation timeout date to be set by the network provider.",

    @"The network operation request is not set. The Branch SDK expects the network operation request to be set by the network provider.":
    @"The network operation request is not set. The Branch SDK expects the network operation request to be set by the network provider.",

    // Other errors
    @"The request was invalid.":
    @"The request was invalid.",

    @"Could not register view.":
    @"Could not register view.",

    @"Could not generate a URL.":
    @"Could not generate a URL.",

    @"User tracking is disabled.":
    @"User tracking is disabled."
    };
    return en_dict;
}

+ (NSDictionary*_Nonnull) ru_localized {

    NSDictionary* ru_dict = @{

    // BNCInitError
    @"The Branch user session has not been initialized.":
    @"Сессия Branch не была инициализирована.",

    // BNCDuplicateResourceError
    @"A resource with this identifier already exists.":
    @"Ресурс с таким идентификатором уже существует.",

    // BNCRedeemCreditsError
    @"You're trying to redeem more credits than are available. Have you loaded rewards?":
    @"Вы пытаетесь применить больше кредитов, чем доступно. Были ли загружены награды?",

    // BNCBadRequestError
    @"The network request was invalid.":
    @"Неправильный сетевой запрос.",

    // BNCServerProblemError
    @"Trouble reaching the Branch servers, please try again shortly.":
    @"Проблемы с соединением с серверами Branch, попробуйте повторить операцию позже.",

    // BNCNilLogError
    @"Can't log error messages because the logger is set to nil.":
    @"Невозможно записать ошибку, так как значение логгера nil.",

    // BNCVersionError
    @"Incompatible version.":
    @"Несовместимая версия.",

    // BNCNetworkServiceInterfaceError
    @"The underlying network service does not conform to the BNCNetworkOperationProtocol.":
    @"Используемый сетевой сервис не соблюдает протокол BNCNetworkOperationProtocol.",

    // BNCInvalidNetworkPublicKeyError
    @"Public key is not an SecKeyRef type.":
    @"Публичный ключ неверного типа. Ожидаемый тип: SecKeyRef.",

    // BNCContentIdentifierError
    @"A canonical identifier or title are required to uniquely identify content.":
    @"Канонический идентификатор или название необходимы для идентификации контента.",

    // BNCSpotlightNotAvailableError
    @"The Core Spotlight indexing service is not available on this device.":
    @"Сервис Core Spotlight Indexing не доступен на этом устройстве.",

    // BNCSpotlightTitleError
    @"Spotlight indexing requires a title.":
    @"Название – необходимый параметр для Spotlight Indexing",

    // BNCRedeemZeroCreditsError
    @"Can't redeem zero credits.":
    @"Нельзя применить ноль кредитов.",

    // Unknown error
    @"Branch encountered an error.":
    @"Неизвестная ошибка в Branch.",

    // Network provider error messages
    @"A network operation instance is expected to be returned by the networkOperationWithURLRequest:completion: method.":
    @"Объект сетевого оператора должен быть возвращен после запроса к методу networkOperationWithURLRequest:completion:.",

    @"Network operation of class '%@' does not conform to the BNCNetworkOperationProtocol.":
    @"Сетевая операция класса '%@' не соответствует протоколу BNCNetworkOperationProtocol.",

    @"The network operation start date is not set. The Branch SDK expects the network operation start date to be set by the network provider.":
    @"Дата старта сетевого запроса не была установлена. SDK Branch ожидает, что дату старта сетевого запроса назначит сетевой провайдер.",

    @"The network operation timeout date is not set. The Branch SDK expects the network operation timeout date to be set by the network provider.":
    @"Дата тайм-аута сетевого запроса не была назначена. SDK Branch ожидает, что дату тайм-аута сетевого запроса назначит сетевой провайдер.",

    @"The network operation request is not set. The Branch SDK expects the network operation request to be set by the network provider.":
    @"Сетевой запрос не был назначен. SDK Branch ожидает, что сетевой запрос назначит сетевой провайдер.",

    // Other errors
    @"The request was invalid.":
    @"Неверный запрос.",

    @"Could not register view.":
    @"Не получилось зарегистрировать view.",

    @"Could not generate a URL.":
    @"Не получилось сгенерировать URL.",

    @"User tracking is disbabled.":
    @"Трекинг пользователя отключен.",
    };

    return ru_dict;
}

@end
