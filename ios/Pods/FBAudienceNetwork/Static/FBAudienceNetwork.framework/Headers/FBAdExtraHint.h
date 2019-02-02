// Copyright 2004-present Facebook. All Rights Reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import <Foundation/Foundation.h>

#import <FBAudienceNetwork/FBAdDefines.h>

NS_ASSUME_NONNULL_BEGIN

typedef NSString *FBAdExtraHintKeyword NS_STRING_ENUM;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordAccessories;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordArtHistory;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordAutomotive;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordBeauty;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordBiology;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordBoardGames;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordBusinessSoftware;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordBuyingSellingHomes;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordCats;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordCelebrities;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordClothing;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordComicBooks;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordDesktopVideo;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordDogs;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordEducation;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordEmail;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordEntertainment;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordFamilyParenting;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordFashion;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordFineArt;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordFoodDrink;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordFrenchCuisine;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordGovernment;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordHealthFitness;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordHobbies;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordHomeGarden;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordHumor;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordInternetTechnology;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordLargeAnimals;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordLaw;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordLegalIssues;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordLiterature;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordMarketing;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordMovies;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordMusic;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordNews;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordPersonalFinance;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordPets;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordPhotography;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordPolitics;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordRealEstate;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordRoleplayingGames;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordScience;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordShopping;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordSociety;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordSports;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordTechnology;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordTelevision;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordTravel;
extern FBAdExtraHintKeyword const FBAdExtraHintKeywordVideoComputerGames;

FB_CLASS_EXPORT
@interface FBAdExtraHint : NSObject

@property (nonatomic, copy, nullable) NSString *contentURL;
@property (nonatomic, copy, nullable) NSString *extraData;

- (instancetype)initWithKeywords:(NSArray<FBAdExtraHintKeyword> *)keywords;

- (void)addKeyword:(FBAdExtraHintKeyword)keyword;
- (void)removeKeyword:(FBAdExtraHintKeyword)keyword;

@end

NS_ASSUME_NONNULL_END
