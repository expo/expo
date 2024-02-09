#ifdef __cplusplus
#import <React/RCTConversions.h>

inline NSArray<NSDictionary *> *convertColorFilters(std::vector<facebook::react::LottieAnimationViewColorFiltersStruct> colorFilterStructArr)
{
    NSMutableArray *filters = [NSMutableArray arrayWithCapacity:colorFilterStructArr.size()];
    
    for (auto colorFilter : colorFilterStructArr) {
        [filters addObject:@{
            @"color": RCTUIColorFromSharedColor(colorFilter.color),
            @"keypath": RCTNSStringFromString(colorFilter.keypath),
        }];
    }
    return filters;
}

inline NSArray<NSDictionary *> *convertTextFilters(std::vector<facebook::react::LottieAnimationViewTextFiltersIOSStruct> textFilterStructArr)
{
    NSMutableArray *filters = [NSMutableArray arrayWithCapacity:textFilterStructArr.size()];
    
    for (auto textFilter : textFilterStructArr) {
        [filters addObject:@{
            @"text": RCTNSStringFromString(textFilter.text),
            @"keypath": RCTNSStringFromString(textFilter.keypath),
        }];
    }
    return filters;
}
#endif
