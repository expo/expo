//
//  BNCCommerceEvent.h
//  Branch-SDK
//
//  Created by Edward Smith on 12/14/16.
//  Copyright (c) 2016 Branch Metrics. All rights reserved.
//

#import "BNCCommerceEvent.h"
#import "BranchConstants.h"
#import "BNCLog.h"

#pragma mark BNCProductCategory

BNCProductCategory BNCProductCategoryAnimalSupplies     = @"Animals & Pet Supplies";
BNCProductCategory BNCProductCategoryApparel            = @"Apparel & Accessories";
BNCProductCategory BNCProductCategoryArtsEntertainment  = @"Arts & Entertainment";
BNCProductCategory BNCProductCategoryBabyToddler        = @"Baby & Toddler";
BNCProductCategory BNCProductCategoryBusinessIndustrial = @"Business & Industrial";
BNCProductCategory BNCProductCategoryCamerasOptics      = @"Cameras & Optics";
BNCProductCategory BNCProductCategoryElectronics        = @"Electronics";
BNCProductCategory BNCProductCategoryFoodBeverageTobacco = @"Food, Beverages & Tobacco";
BNCProductCategory BNCProductCategoryFurniture          = @"Furniture";
BNCProductCategory BNCProductCategoryHardware           = @"Hardware";
BNCProductCategory BNCProductCategoryHealthBeauty       = @"Health & Beauty";
BNCProductCategory BNCProductCategoryHomeGarden         = @"Home & Garden";
BNCProductCategory BNCProductCategoryLuggageBags        = @"Luggage & Bags";
BNCProductCategory BNCProductCategoryMature             = @"Mature";
BNCProductCategory BNCProductCategoryMedia              = @"Media";
BNCProductCategory BNCProductCategoryOfficeSupplies     = @"Office Supplies";
BNCProductCategory BNCProductCategoryReligious          = @"Religious & Ceremonial";
BNCProductCategory BNCProductCategorySoftware           = @"Software";
BNCProductCategory BNCProductCategorySportingGoods      = @"Sporting Goods";
BNCProductCategory BNCProductCategoryToysGames          = @"Toys & Games";
BNCProductCategory BNCProductCategoryVehiclesParts      = @"Vehicles & Parts";

NSArray<BNCProductCategory>* BNCProductCategoryAllCategories(void) {
    return @[
        BNCProductCategoryAnimalSupplies,
        BNCProductCategoryApparel,
        BNCProductCategoryArtsEntertainment,
        BNCProductCategoryBabyToddler,
        BNCProductCategoryBusinessIndustrial,
        BNCProductCategoryCamerasOptics,
        BNCProductCategoryElectronics,
        BNCProductCategoryFoodBeverageTobacco,
        BNCProductCategoryFurniture,
        BNCProductCategoryHardware,
        BNCProductCategoryHealthBeauty,
        BNCProductCategoryHomeGarden,
        BNCProductCategoryLuggageBags,
        BNCProductCategoryMature,
        BNCProductCategoryMedia,
        BNCProductCategoryOfficeSupplies,
        BNCProductCategoryReligious,
        BNCProductCategorySoftware,
        BNCProductCategorySportingGoods,
        BNCProductCategoryToysGames,
        BNCProductCategoryVehiclesParts,
    ];
}

#pragma mark - BNCCurrency

BNCCurrency BNCCurrencyAED = @"AED";
BNCCurrency BNCCurrencyAFN = @"AFN";
BNCCurrency BNCCurrencyALL = @"ALL";
BNCCurrency BNCCurrencyAMD = @"AMD";
BNCCurrency BNCCurrencyANG = @"ANG";
BNCCurrency BNCCurrencyAOA = @"AOA";
BNCCurrency BNCCurrencyARS = @"ARS";
BNCCurrency BNCCurrencyAUD = @"AUD";
BNCCurrency BNCCurrencyAWG = @"AWG";
BNCCurrency BNCCurrencyAZN = @"AZN";
BNCCurrency BNCCurrencyBAM = @"BAM";
BNCCurrency BNCCurrencyBBD = @"BBD";

BNCCurrency BNCCurrencyBDT = @"BDT";
BNCCurrency BNCCurrencyBGN = @"BGN";
BNCCurrency BNCCurrencyBHD = @"BHD";
BNCCurrency BNCCurrencyBIF = @"BIF";
BNCCurrency BNCCurrencyBMD = @"BMD";
BNCCurrency BNCCurrencyBND = @"BND";
BNCCurrency BNCCurrencyBOB = @"BOB";
BNCCurrency BNCCurrencyBOV = @"BOV";
BNCCurrency BNCCurrencyBRL = @"BRL";
BNCCurrency BNCCurrencyBSD = @"BSD";
BNCCurrency BNCCurrencyBTN = @"BTN";
BNCCurrency BNCCurrencyBWP = @"BWP";

BNCCurrency BNCCurrencyBYN = @"BYN";
BNCCurrency BNCCurrencyBYR = @"BYR";
BNCCurrency BNCCurrencyBZD = @"BZD";
BNCCurrency BNCCurrencyCAD = @"CAD";
BNCCurrency BNCCurrencyCDF = @"CDF";
BNCCurrency BNCCurrencyCHE = @"CHE";
BNCCurrency BNCCurrencyCHF = @"CHF";
BNCCurrency BNCCurrencyCHW = @"CHW";
BNCCurrency BNCCurrencyCLF = @"CLF";
BNCCurrency BNCCurrencyCLP = @"CLP";
BNCCurrency BNCCurrencyCNY = @"CNY";
BNCCurrency BNCCurrencyCOP = @"COP";

BNCCurrency BNCCurrencyCOU = @"COU";
BNCCurrency BNCCurrencyCRC = @"CRC";
BNCCurrency BNCCurrencyCUC = @"CUC";
BNCCurrency BNCCurrencyCUP = @"CUP";
BNCCurrency BNCCurrencyCVE = @"CVE";
BNCCurrency BNCCurrencyCZK = @"CZK";
BNCCurrency BNCCurrencyDJF = @"DJF";
BNCCurrency BNCCurrencyDKK = @"DKK";
BNCCurrency BNCCurrencyDOP = @"DOP";
BNCCurrency BNCCurrencyDZD = @"DZD";
BNCCurrency BNCCurrencyEGP = @"EGP";
BNCCurrency BNCCurrencyERN = @"ERN";

BNCCurrency BNCCurrencyETB = @"ETB";
BNCCurrency BNCCurrencyEUR = @"EUR";
BNCCurrency BNCCurrencyFJD = @"FJD";
BNCCurrency BNCCurrencyFKP = @"FKP";
BNCCurrency BNCCurrencyGBP = @"GBP";
BNCCurrency BNCCurrencyGEL = @"GEL";
BNCCurrency BNCCurrencyGHS = @"GHS";
BNCCurrency BNCCurrencyGIP = @"GIP";
BNCCurrency BNCCurrencyGMD = @"GMD";
BNCCurrency BNCCurrencyGNF = @"GNF";
BNCCurrency BNCCurrencyGTQ = @"GTQ";
BNCCurrency BNCCurrencyGYD = @"GYD";

BNCCurrency BNCCurrencyHKD = @"HKD";
BNCCurrency BNCCurrencyHNL = @"HNL";
BNCCurrency BNCCurrencyHRK = @"HRK";
BNCCurrency BNCCurrencyHTG = @"HTG";
BNCCurrency BNCCurrencyHUF = @"HUF";
BNCCurrency BNCCurrencyIDR = @"IDR";
BNCCurrency BNCCurrencyILS = @"ILS";
BNCCurrency BNCCurrencyINR = @"INR";
BNCCurrency BNCCurrencyIQD = @"IQD";
BNCCurrency BNCCurrencyIRR = @"IRR";
BNCCurrency BNCCurrencyISK = @"ISK";
BNCCurrency BNCCurrencyJMD = @"JMD";

BNCCurrency BNCCurrencyJOD = @"JOD";
BNCCurrency BNCCurrencyJPY = @"JPY";
BNCCurrency BNCCurrencyKES = @"KES";
BNCCurrency BNCCurrencyKGS = @"KGS";
BNCCurrency BNCCurrencyKHR = @"KHR";
BNCCurrency BNCCurrencyKMF = @"KMF";
BNCCurrency BNCCurrencyKPW = @"KPW";
BNCCurrency BNCCurrencyKRW = @"KRW";
BNCCurrency BNCCurrencyKWD = @"KWD";
BNCCurrency BNCCurrencyKYD = @"KYD";
BNCCurrency BNCCurrencyKZT = @"KZT";
BNCCurrency BNCCurrencyLAK = @"LAK";

BNCCurrency BNCCurrencyLBP = @"LBP";
BNCCurrency BNCCurrencyLKR = @"LKR";
BNCCurrency BNCCurrencyLRD = @"LRD";
BNCCurrency BNCCurrencyLSL = @"LSL";
BNCCurrency BNCCurrencyLYD = @"LYD";
BNCCurrency BNCCurrencyMAD = @"MAD";
BNCCurrency BNCCurrencyMDL = @"MDL";
BNCCurrency BNCCurrencyMGA = @"MGA";
BNCCurrency BNCCurrencyMKD = @"MKD";
BNCCurrency BNCCurrencyMMK = @"MMK";
BNCCurrency BNCCurrencyMNT = @"MNT";
BNCCurrency BNCCurrencyMOP = @"MOP";

BNCCurrency BNCCurrencyMRO = @"MRO";
BNCCurrency BNCCurrencyMUR = @"MUR";
BNCCurrency BNCCurrencyMVR = @"MVR";
BNCCurrency BNCCurrencyMWK = @"MWK";
BNCCurrency BNCCurrencyMXN = @"MXN";
BNCCurrency BNCCurrencyMXV = @"MXV";
BNCCurrency BNCCurrencyMYR = @"MYR";
BNCCurrency BNCCurrencyMZN = @"MZN";
BNCCurrency BNCCurrencyNAD = @"NAD";
BNCCurrency BNCCurrencyNGN = @"NGN";
BNCCurrency BNCCurrencyNIO = @"NIO";
BNCCurrency BNCCurrencyNOK = @"NOK";

BNCCurrency BNCCurrencyNPR = @"NPR";
BNCCurrency BNCCurrencyNZD = @"NZD";
BNCCurrency BNCCurrencyOMR = @"OMR";
BNCCurrency BNCCurrencyPAB = @"PAB";
BNCCurrency BNCCurrencyPEN = @"PEN";
BNCCurrency BNCCurrencyPGK = @"PGK";
BNCCurrency BNCCurrencyPHP = @"PHP";
BNCCurrency BNCCurrencyPKR = @"PKR";
BNCCurrency BNCCurrencyPLN = @"PLN";
BNCCurrency BNCCurrencyPYG = @"PYG";
BNCCurrency BNCCurrencyQAR = @"QAR";
BNCCurrency BNCCurrencyRON = @"RON";

BNCCurrency BNCCurrencyRSD = @"RSD";
BNCCurrency BNCCurrencyRUB = @"RUB";
BNCCurrency BNCCurrencyRWF = @"RWF";
BNCCurrency BNCCurrencySAR = @"SAR";
BNCCurrency BNCCurrencySBD = @"SBD";
BNCCurrency BNCCurrencySCR = @"SCR";
BNCCurrency BNCCurrencySDG = @"SDG";
BNCCurrency BNCCurrencySEK = @"SEK";
BNCCurrency BNCCurrencySGD = @"SGD";
BNCCurrency BNCCurrencySHP = @"SHP";
BNCCurrency BNCCurrencySLL = @"SLL";
BNCCurrency BNCCurrencySOS = @"SOS";

BNCCurrency BNCCurrencySRD = @"SRD";
BNCCurrency BNCCurrencySSP = @"SSP";
BNCCurrency BNCCurrencySTD = @"STD";
BNCCurrency BNCCurrencySYP = @"SYP";
BNCCurrency BNCCurrencySZL = @"SZL";
BNCCurrency BNCCurrencyTHB = @"THB";
BNCCurrency BNCCurrencyTJS = @"TJS";
BNCCurrency BNCCurrencyTMT = @"TMT";
BNCCurrency BNCCurrencyTND = @"TND";
BNCCurrency BNCCurrencyTOP = @"TOP";
BNCCurrency BNCCurrencyTRY = @"TRY";
BNCCurrency BNCCurrencyTTD = @"TTD";

BNCCurrency BNCCurrencyTWD = @"TWD";
BNCCurrency BNCCurrencyTZS = @"TZS";
BNCCurrency BNCCurrencyUAH = @"UAH";
BNCCurrency BNCCurrencyUGX = @"UGX";
BNCCurrency BNCCurrencyUSD = @"USD";
BNCCurrency BNCCurrencyUSN = @"USN";
BNCCurrency BNCCurrencyUYI = @"UYI";
BNCCurrency BNCCurrencyUYU = @"UYU";
BNCCurrency BNCCurrencyUZS = @"UZS";
BNCCurrency BNCCurrencyVEF = @"VEF";
BNCCurrency BNCCurrencyVND = @"VND";
BNCCurrency BNCCurrencyVUV = @"VUV";

BNCCurrency BNCCurrencyWST = @"WST";
BNCCurrency BNCCurrencyXAF = @"XAF";
BNCCurrency BNCCurrencyXAG = @"XAG";
BNCCurrency BNCCurrencyXAU = @"XAU";
BNCCurrency BNCCurrencyXBA = @"XBA";
BNCCurrency BNCCurrencyXBB = @"XBB";
BNCCurrency BNCCurrencyXBC = @"XBC";
BNCCurrency BNCCurrencyXBD = @"XBD";
BNCCurrency BNCCurrencyXCD = @"XCD";
BNCCurrency BNCCurrencyXDR = @"XDR";
BNCCurrency BNCCurrencyXFU = @"XFU";
BNCCurrency BNCCurrencyXOF = @"XOF";

BNCCurrency BNCCurrencyXPD = @"XPD";
BNCCurrency BNCCurrencyXPF = @"XPF";
BNCCurrency BNCCurrencyXPT = @"XPT";
BNCCurrency BNCCurrencyXSU = @"XSU";
BNCCurrency BNCCurrencyXTS = @"XTS";
BNCCurrency BNCCurrencyXUA = @"XUA";
BNCCurrency BNCCurrencyXXX = @"XXX";
BNCCurrency BNCCurrencyYER = @"YER";
BNCCurrency BNCCurrencyZAR = @"ZAR";
BNCCurrency BNCCurrencyZMW = @"ZMW";

NSArray<BNCCurrency>* BNCCurrencyAllCurrencies(void) {
    return @[
        BNCCurrencyAED,
        BNCCurrencyAFN,
        BNCCurrencyALL,
        BNCCurrencyAMD,
        BNCCurrencyANG,
        BNCCurrencyAOA,
        BNCCurrencyARS,
        BNCCurrencyAUD,
        BNCCurrencyAWG,
        BNCCurrencyAZN,
        BNCCurrencyBAM,
        BNCCurrencyBBD,

        BNCCurrencyBDT,
        BNCCurrencyBGN,
        BNCCurrencyBHD,
        BNCCurrencyBIF,
        BNCCurrencyBMD,
        BNCCurrencyBND,
        BNCCurrencyBOB,
        BNCCurrencyBOV,
        BNCCurrencyBRL,
        BNCCurrencyBSD,
        BNCCurrencyBTN,
        BNCCurrencyBWP,

        BNCCurrencyBYN,
        BNCCurrencyBYR,
        BNCCurrencyBZD,
        BNCCurrencyCAD,
        BNCCurrencyCDF,
        BNCCurrencyCHE,
        BNCCurrencyCHF,
        BNCCurrencyCHW,
        BNCCurrencyCLF,
        BNCCurrencyCLP,
        BNCCurrencyCNY,
        BNCCurrencyCOP,

        BNCCurrencyCOU,
        BNCCurrencyCRC,
        BNCCurrencyCUC,
        BNCCurrencyCUP,
        BNCCurrencyCVE,
        BNCCurrencyCZK,
        BNCCurrencyDJF,
        BNCCurrencyDKK,
        BNCCurrencyDOP,
        BNCCurrencyDZD,
        BNCCurrencyEGP,
        BNCCurrencyERN,

        BNCCurrencyETB,
        BNCCurrencyEUR,
        BNCCurrencyFJD,
        BNCCurrencyFKP,
        BNCCurrencyGBP,
        BNCCurrencyGEL,
        BNCCurrencyGHS,
        BNCCurrencyGIP,
        BNCCurrencyGMD,
        BNCCurrencyGNF,
        BNCCurrencyGTQ,
        BNCCurrencyGYD,

        BNCCurrencyHKD,
        BNCCurrencyHNL,
        BNCCurrencyHRK,
        BNCCurrencyHTG,
        BNCCurrencyHUF,
        BNCCurrencyIDR,
        BNCCurrencyILS,
        BNCCurrencyINR,
        BNCCurrencyIQD,
        BNCCurrencyIRR,
        BNCCurrencyISK,
        BNCCurrencyJMD,

        BNCCurrencyJOD,
        BNCCurrencyJPY,
        BNCCurrencyKES,
        BNCCurrencyKGS,
        BNCCurrencyKHR,
        BNCCurrencyKMF,
        BNCCurrencyKPW,
        BNCCurrencyKRW,
        BNCCurrencyKWD,
        BNCCurrencyKYD,
        BNCCurrencyKZT,
        BNCCurrencyLAK,

        BNCCurrencyLBP,
        BNCCurrencyLKR,
        BNCCurrencyLRD,
        BNCCurrencyLSL,
        BNCCurrencyLYD,
        BNCCurrencyMAD,
        BNCCurrencyMDL,
        BNCCurrencyMGA,
        BNCCurrencyMKD,
        BNCCurrencyMMK,
        BNCCurrencyMNT,
        BNCCurrencyMOP,

        BNCCurrencyMRO,
        BNCCurrencyMUR,
        BNCCurrencyMVR,
        BNCCurrencyMWK,
        BNCCurrencyMXN,
        BNCCurrencyMXV,
        BNCCurrencyMYR,
        BNCCurrencyMZN,
        BNCCurrencyNAD,
        BNCCurrencyNGN,
        BNCCurrencyNIO,
        BNCCurrencyNOK,

        BNCCurrencyNPR,
        BNCCurrencyNZD,
        BNCCurrencyOMR,
        BNCCurrencyPAB,
        BNCCurrencyPEN,
        BNCCurrencyPGK,
        BNCCurrencyPHP,
        BNCCurrencyPKR,
        BNCCurrencyPLN,
        BNCCurrencyPYG,
        BNCCurrencyQAR,
        BNCCurrencyRON,

        BNCCurrencyRSD,
        BNCCurrencyRUB,
        BNCCurrencyRWF,
        BNCCurrencySAR,
        BNCCurrencySBD,
        BNCCurrencySCR,
        BNCCurrencySDG,
        BNCCurrencySEK,
        BNCCurrencySGD,
        BNCCurrencySHP,
        BNCCurrencySLL,
        BNCCurrencySOS,

        BNCCurrencySRD,
        BNCCurrencySSP,
        BNCCurrencySTD,
        BNCCurrencySYP,
        BNCCurrencySZL,
        BNCCurrencyTHB,
        BNCCurrencyTJS,
        BNCCurrencyTMT,
        BNCCurrencyTND,
        BNCCurrencyTOP,
        BNCCurrencyTRY,
        BNCCurrencyTTD,

        BNCCurrencyTWD,
        BNCCurrencyTZS,
        BNCCurrencyUAH,
        BNCCurrencyUGX,
        BNCCurrencyUSD,
        BNCCurrencyUSN,
        BNCCurrencyUYI,
        BNCCurrencyUYU,
        BNCCurrencyUZS,
        BNCCurrencyVEF,
        BNCCurrencyVND,
        BNCCurrencyVUV,

        BNCCurrencyWST,
        BNCCurrencyXAF,
        BNCCurrencyXAG,
        BNCCurrencyXAU,
        BNCCurrencyXBA,
        BNCCurrencyXBB,
        BNCCurrencyXBC,
        BNCCurrencyXBD,
        BNCCurrencyXCD,
        BNCCurrencyXDR,
        BNCCurrencyXFU,
        BNCCurrencyXOF,

        BNCCurrencyXPD,
        BNCCurrencyXPF,
        BNCCurrencyXPT,
        BNCCurrencyXSU,
        BNCCurrencyXTS,
        BNCCurrencyXUA,
        BNCCurrencyXXX,
        BNCCurrencyYER,
        BNCCurrencyZAR,
        BNCCurrencyZMW,
    ];
}

#pragma mark - BNCProduct

@implementation BNCProduct

- (NSMutableDictionary*) dictionary {
	NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];

	#define assign(x) \
		do { if (self.x != nil) { dictionary[@#x] = self.x; } } while (0)

	assign(sku);
	assign(name);
	assign(price);
	assign(quantity);
	assign(brand);
	assign(category);
	assign(variant);

	#undef assign

	return dictionary;
}

- (NSString*) description {
    return [NSString stringWithFormat:
        @"Name: %@ Sku: %@ Price: %@ Quantity: %@ Brand: %@ Category: %@ Variant: %@",
        self.name,
        self.sku,
        self.price,
        self.quantity,
        self.brand,
        self.category,
        self.variant];
}

@end

#pragma mark - BNCCommerceEvent

@implementation BNCCommerceEvent : NSObject

- (NSDictionary*) dictionary {
	NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];

	#define assign(x) \
		do { if (self.x) { dictionary[@#x] = self.x; } } while (0)

	assign(revenue);
	assign(currency);
    if (self.transactionID) {
        dictionary[@"transaction_id"] = self.transactionID;
    }
	assign(shipping);
	assign(tax);
	assign(coupon);
	assign(affiliation);

	NSMutableArray *products = [NSMutableArray arrayWithCapacity:self.products.count];
	for (BNCProduct *product in self.products) {
		NSDictionary * d = [product dictionary];
		if (d) [products addObject:d];
	}
    dictionary[@"products"] = products;
	
	#undef assign
	
	return dictionary;
}

- (NSString*) description {
    return [NSString stringWithFormat:
        @"Revenue: %@ Currency: %@ TxID: %@ Shipping: %@ Tax: %@ Coupon: %@ Affl: %@ Products: %lu",
        self.revenue,
        self.currency,
        self.transactionID,
        self.shipping,
        self.tax,
        self.coupon,
        self.affiliation,
        (unsigned long) self.products.count];
}

@end

#pragma mark - BranchCommerceEventRequest

@interface BranchCommerceEventRequest ()
@property (strong) NSDictionary *commerceDictionary;
@property (strong) NSDictionary *metadata;
@property (copy)   void (^completion)(NSDictionary* response, NSError* error);
@end

@implementation BranchCommerceEventRequest

- (instancetype) initWithCommerceEvent:(BNCCommerceEvent*)commerceEvent
							  metadata:(NSDictionary*)metadata
							completion:(void (^)(NSDictionary* response, NSError* error))completion {
	self = [super init];
	if (!self) return self;

    if ([commerceEvent.revenue isEqualToNumber:[NSDecimalNumber numberWithDouble:0.0]]) {
        BNCLogWarning(@"Sending a commerce event with zero revenue.");
    }

	self.commerceDictionary = [commerceEvent dictionary];
	self.metadata = metadata;
	self.completion = completion;
	return self;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface
			    key:(NSString *)key callback:(BNCServerCallback)callback {

    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];

    NSMutableDictionary *params = [NSMutableDictionary dictionary];
    params[BRANCH_REQUEST_KEY_ACTION] = @"purchase";
    params[BRANCH_REQUEST_KEY_DEVICE_FINGERPRINT_ID] = preferenceHelper.deviceFingerprintID;
    params[BRANCH_REQUEST_KEY_BRANCH_IDENTITY] = preferenceHelper.identityID;
    params[BRANCH_REQUEST_KEY_SESSION_ID] = preferenceHelper.sessionID;

	if (self.metadata)
		params[@"metadata"] = self.metadata;
	if (self.commerceDictionary)
		params[@"commerce_data"] = self.commerceDictionary;
    if (preferenceHelper.limitFacebookTracking)
        params[@"limit_facebook_tracking"] = (__bridge NSNumber*) kCFBooleanTrue;

	NSString *URL = [preferenceHelper getAPIURL:BRANCH_REQUEST_ENDPOINT_USER_COMPLETED_ACTION];
    [serverInterface postRequest:params
							 url:URL
							 key:key
						callback:callback];
}

- (void)processResponse:(BNCServerResponse*)response
				  error:(NSError*)error {

	NSDictionary *dictionary =
		([response.data isKindOfClass:[NSDictionary class]])
		? (NSDictionary*) response.data
		: nil;
		
	if (self.completion)
		self.completion(dictionary, error);
}

#pragma mark BranchCommerceEventRequest NSSecureCoding

- (instancetype)initWithCoder:(NSCoder *)decoder {
    self = [super initWithCoder:decoder];
	if (!self) return self;
	self.commerceDictionary = [decoder decodeObjectOfClass:NSDictionary.class forKey:@"commerceDictionary"];
	self.metadata = [decoder decodeObjectOfClass:NSDictionary.class forKey:@"metaData"];
    return self;
}

- (void)encodeWithCoder:(NSCoder *)coder {
    [super encodeWithCoder:coder];
    [coder encodeObject:self.commerceDictionary forKey:@"commerceDictionary"];
    [coder encodeObject:self.metadata forKey:@"metadata"];
}

+ (BOOL) supportsSecureCoding {
    return YES;
}

@end
