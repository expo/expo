/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

#ifndef _ZXINGOBJC_

#define _ZXINGOBJC_

#import "ZXingObjCCore.h"

#if defined(ZXINGOBJC_AZTEC) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXingObjCAztec.h"
#endif
#if defined(ZXINGOBJC_DATAMATRIX) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXingObjCDataMatrix.h"
#endif
#if defined(ZXINGOBJC_MAXICODE) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXingObjCMaxiCode.h"
#endif
#if defined(ZXINGOBJC_ONED) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXingObjCOneD.h"
#endif
#if defined(ZXINGOBJC_PDF417) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXingObjCPDF417.h"
#endif
#if defined(ZXINGOBJC_QRCODE) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXingObjCQRCode.h"
#endif

#import "ZXMultiFormatReader.h"
#import "ZXMultiFormatWriter.h"

#endif
