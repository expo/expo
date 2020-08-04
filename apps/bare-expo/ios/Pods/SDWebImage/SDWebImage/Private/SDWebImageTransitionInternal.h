/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import "SDWebImageCompat.h"

#if SD_MAC

#import <QuartzCore/QuartzCore.h>

/// Helper method for Core Animation transition
FOUNDATION_EXPORT CAMediaTimingFunction * _Nullable SDTimingFunctionFromAnimationOptions(SDWebImageAnimationOptions options);
FOUNDATION_EXPORT CATransition * _Nullable SDTransitionFromAnimationOptions(SDWebImageAnimationOptions options);

#endif
