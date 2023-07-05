/*
Copyright 2014 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

#if defined(SVGNATIVE_USER_CONFIG)
#include SVGNATIVE_USER_CONFIG
#endif

#ifndef SVGViewer_Config_h
#define SVGViewer_Config_h

#ifndef SVG_ASSERT
#define SVG_ASSERT(exp) assert(exp);
#endif
#ifndef SVG_ASSERT_MSG
#define SVG_ASSERT_MSG(exp, _message) void();
#endif

#ifndef SVG_PARSE_TRACE
#define SVG_PARSE_TRACE(_message) void();
#endif
#ifndef SVG_DRAW_TRACE
#define SVG_DRAW_TRACE(_message) void();
#endif
#ifndef SVG_CSS_TRACE
#define SVG_CSS_TRACE(_message) void();
#endif

#if defined _MSC_VER || defined __CYGWIN__
	#ifndef DllImport
		#define DllImport __declspec(dllimport)
	#endif
	#ifndef DllExport 
		#define DllExport __declspec(dllexport)
    #endif
#else
	#ifndef DllImport
		#define DllImport
	#endif
	#ifndef DllExport 
		#define DllExport __attribute__((visibility("default")))
	#endif
#endif

#ifdef BUILDING_DLL
	#ifdef SVG_IMPORT
		#define SVG_IMP_EXP DllImport
	#else
		#define SVG_IMP_EXP DllExport
	#endif
#else
	#define SVG_IMP_EXP
#endif

#endif /* SVGViewer_Config_h */
