export function getIosModelName(modelId) {
    const knownModelName = iosModelNames[modelId];
    if (knownModelName) {
        return knownModelName;
    }
    // Infer the main type of model from the ID
    if (modelId.startsWith('iPod')) {
        return 'iPod Touch';
    }
    if (modelId.startsWith('iPad')) {
        return 'iPad';
    }
    if (modelId.startsWith('iPhone')) {
        return 'iPhone';
    }
    if (modelId.startsWith('AppleTV')) {
        return 'Apple TV';
    }
    return null;
}
export const iosModelNames = {
    'iPod1,1': 'iPod Touch',
    'iPod2,1': 'iPod Touch',
    'iPod3,1': 'iPod Touch',
    'iPod4,1': 'iPod Touch',
    'iPod5,1': 'iPod Touch',
    'iPod7,1': 'iPod Touch',
    'iPhone1,1': 'iPhone',
    'iPhone1,2': 'iPhone 3G',
    'iPhone2,1': 'iPhone 3GS',
    'iPad1,1': 'iPad',
    'iPad2,1': 'iPad 2',
    'iPad2,2': 'iPad 2',
    'iPad2,3': 'iPad 2',
    'iPad2,4': 'iPad 2',
    'iPad3,1': 'iPad',
    'iPad3,2': 'iPad',
    'iPad3,3': 'iPad',
    'iPhone3,1': 'iPhone 4',
    'iPhone3,2': 'iPhone 4',
    'iPhone3,3': 'iPhone 4',
    'iPhone4,1': 'iPhone 4S',
    'iPhone5,1': 'iPhone 5',
    'iPhone5,2': 'iPhone 5',
    'iPad3,4': 'iPad',
    'iPad3,5': 'iPad',
    'iPad3,6': 'iPad',
    'iPad2,5': 'iPad Mini',
    'iPad2,6': 'iPad Mini',
    'iPad2,7': 'iPad Mini',
    'iPhone5,3': 'iPhone 5c',
    'iPhone5,4': 'iPhone 5c',
    'iPhone6,1': 'iPhone 5s',
    'iPhone6,2': 'iPhone 5s',
    'iPhone7,1': 'iPhone 6 Plus',
    'iPhone7,2': 'iPhone 6',
    'iPhone8,1': 'iPhone 6s',
    'iPhone8,2': 'iPhone 6s Plus',
    'iPhone8,4': 'iPhone SE',
    'iPhone9,1': 'iPhone 7',
    'iPhone9,3': 'iPhone 7',
    'iPhone9,2': 'iPhone 7 Plus',
    'iPhone9,4': 'iPhone 7 Plus',
    'iPhone10,3': 'iPhone X',
    'iPhone10,6': 'iPhone X',
    'iPhone10,1': 'iPhone 8',
    'iPhone10,4': 'iPhone 8',
    'iPhone10,2': 'iPhone 8 Plus',
    'iPhone10,5': 'iPhone 8 Plus',
    'iPhone11,2': 'iPhone XS',
    'iPhone11,4': 'iPhone XS Max',
    'iPhone11,6': 'iPhone XS Max',
    'iPhone11,8': 'iPhone XR',
    'iPhone12,1': 'iPhone 11',
    'iPhone12,3': 'iPhone 11 Pro',
    'iPhone12,5': 'iPhone 11 Pro Max',
    'iPad4,1': 'iPad Air',
    'iPad4,2': 'iPad Air',
    'iPad4,3': 'iPad Air',
    'iPad4,4': 'iPad Mini 2',
    'iPad4,5': 'iPad Mini 2',
    'iPad4,6': 'iPad Mini 2',
    'iPad4,7': 'iPad Mini 3',
    'iPad4,8': 'iPad Mini 3',
    'iPad4,9': 'iPad Mini 3',
    'iPad5,1': 'iPad Mini 4',
    'iPad5,2': 'iPad Mini 4',
    'iPad5,3': 'iPad Air 2',
    'iPad5,4': 'iPad Air 2',
    'iPad6,3': 'iPad Pro 9.7-inch',
    'iPad6,4': 'iPad Pro 9.7-inch',
    'iPad6,7': 'iPad Pro 12.9-inch',
    'iPad6,8': 'iPad Pro 12.9-inch',
    'iPad7,1': 'iPad Pro 12.9-inch',
    'iPad7,2': 'iPad Pro 12.9-inch',
    'iPad7,3': 'iPad Pro 10.5-inch',
    'iPad7,4': 'iPad Pro 10.5-inch',
    'iPad7,5': 'iPad (6th generation)',
    'iPad7,6': 'iPad (6th generation)',
    'iPad8,1': 'iPad Pro 11-inch (3rd generation)',
    'iPad8,2': 'iPad Pro 11-inch (3rd generation)',
    'iPad8,3': 'iPad Pro 11-inch (3rd generation)',
    'iPad8,4': 'iPad Pro 11-inch (3rd generation)',
    'iPad8,5': 'iPad Pro 12.9-inch (3rd generation)',
    'iPad8,6': 'iPad Pro 12.9-inch (3rd generation)',
    'iPad8,7': 'iPad Pro 12.9-inch (3rd generation)',
    'iPad8,8': 'iPad Pro 12.9-inch (3rd generation)',
    'AppleTV2,1': 'Apple TV',
    'AppleTV3,1': 'Apple TV',
    'AppleTV3,2': 'Apple TV',
    'AppleTV5,3': 'Apple TV',
    'AppleTV6,2': 'Apple TV 4K',
};
//# sourceMappingURL=ModelNames.js.map