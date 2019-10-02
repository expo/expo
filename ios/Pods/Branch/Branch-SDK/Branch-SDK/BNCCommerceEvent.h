//
//  BNCCommerceEvent.h
//  Branch-SDK
//
//  Created by Edward Smith on 12/14/16.
//  Copyright (c) 2016 Branch Metrics. All rights reserved.
//

#import "BNCServerRequest.h"
#import "BNCAvailability.h"

#pragma mark BNCProductCategory

typedef NSString*const BNCProductCategory NS_STRING_ENUM;

FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryAnimalSupplies;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryApparel;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryArtsEntertainment;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryBabyToddler;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryBusinessIndustrial;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryCamerasOptics;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryElectronics;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryFoodBeverageTobacco;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryFurniture;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryHardware;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryHealthBeauty;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryHomeGarden;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryLuggageBags;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryMature;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryMedia;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryOfficeSupplies;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryReligious;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategorySoftware;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategorySportingGoods;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryToysGames;
FOUNDATION_EXPORT  BNCProductCategory _Nonnull BNCProductCategoryVehiclesParts;

NSArray<BNCProductCategory>*_Nonnull BNCProductCategoryAllCategories(void);

#pragma mark - BNCCurrency

typedef NSString*const BNCCurrency NS_STRING_ENUM;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyAED;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyAFN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyALL;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyAMD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyANG;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyAOA;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyARS;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyAUD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyAWG;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyAZN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBAM;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBBD;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBDT;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBGN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBHD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBIF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBMD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBND;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBOB;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBOV;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBRL;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBSD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBTN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBWP;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBYN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBYR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyBZD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCAD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCDF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCHE;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCHF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCHW;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCLF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCLP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCNY;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCOP;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCOU;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCRC;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCUC;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCUP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCVE;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyCZK;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyDJF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyDKK;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyDOP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyDZD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyEGP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyERN;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyETB;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyEUR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyFJD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyFKP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyGBP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyGEL;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyGHS;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyGIP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyGMD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyGNF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyGTQ;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyGYD;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyHKD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyHNL;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyHRK;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyHTG;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyHUF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyIDR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyILS;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyINR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyIQD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyIRR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyISK;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyJMD;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyJOD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyJPY;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyKES;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyKGS;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyKHR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyKMF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyKPW;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyKRW;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyKWD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyKYD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyKZT;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyLAK;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyLBP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyLKR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyLRD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyLSL;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyLYD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMAD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMDL;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMGA;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMKD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMMK;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMNT;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMOP;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMRO;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMUR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMVR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMWK;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMXN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMXV;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMYR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyMZN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyNAD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyNGN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyNIO;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyNOK;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyNPR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyNZD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyOMR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyPAB;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyPEN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyPGK;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyPHP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyPKR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyPLN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyPYG;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyQAR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyRON;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyRSD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyRUB;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyRWF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySAR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySBD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySCR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySDG;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySEK;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySGD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySHP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySLL;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySOS;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySRD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySSP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySTD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySYP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencySZL;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyTHB;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyTJS;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyTMT;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyTND;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyTOP;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyTRY;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyTTD;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyTWD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyTZS;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyUAH;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyUGX;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyUSD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyUSN;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyUYI;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyUYU;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyUZS;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyVEF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyVND;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyVUV;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyWST;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXAF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXAG;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXAU;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXBA;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXBB;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXBC;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXBD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXCD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXDR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXFU;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXOF;

FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXPD;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXPF;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXPT;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXSU;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXTS;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXUA;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyXXX;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyYER;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyZAR;
FOUNDATION_EXPORT  BNCCurrency _Nonnull BNCCurrencyZMW;

NSArray<BNCCurrency>*_Nonnull BNCCurrencyAllCurrencies(void);

#pragma mark - BNCProduct

@interface BNCProduct : NSObject
@property (nonatomic, strong) NSString*_Nullable            sku;
@property (nonatomic, strong) NSString*_Nullable            name;
@property (nonatomic, strong) NSDecimalNumber*_Nullable     price;
@property (nonatomic, strong) NSNumber*_Nullable            quantity;
@property (nonatomic, strong) NSString*_Nullable            brand;
@property (nonatomic, strong) BNCProductCategory _Nullable  category;
@property (nonatomic, strong) NSString*_Nullable            variant;
@end

#pragma mark - BNCCommerceEvent

//__attribute__((deprecated(("Please use BranchEvent to track commerce events."))))
@interface BNCCommerceEvent : NSObject
@property (nonatomic, strong) NSDecimalNumber*_Nullable     revenue;
@property (nonatomic, strong) BNCCurrency _Nullable         currency;
@property (nonatomic, strong) NSString*_Nullable            transactionID;
@property (nonatomic, strong) NSDecimalNumber*_Nullable     shipping;
@property (nonatomic, strong) NSDecimalNumber*_Nullable     tax;
@property (nonatomic, strong) NSString*_Nullable            coupon;
@property (nonatomic, strong) NSString*_Nullable            affiliation;
@property (nonatomic, strong) NSArray<BNCProduct*>*_Nullable products;
@end


@interface BranchCommerceEventRequest : BNCServerRequest <NSSecureCoding>

- (instancetype _Nonnull) initWithCommerceEvent:(BNCCommerceEvent*_Nonnull)commerceEvent
							           metadata:(NSDictionary*_Nullable)dictionary
							         completion:
            (void (^_Nullable)(NSDictionary*_Nullable response, NSError*_Nullable error))callBack;

@end
