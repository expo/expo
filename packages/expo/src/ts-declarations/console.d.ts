/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved. 
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0  
 
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, 
MERCHANTABLITY OR NON-INFRINGEMENT. 
 
See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

/**
 * This is a more comprehensive declaration of the Console API that JavaScript VMs include.
 *
 * This declaration is from https://github.com/Microsoft/TypeScript/blob/master/lib/lib.dom.d.ts
 */
interface Console {
  memory: any;
  assert(condition?: boolean, message?: string, ...data: any[]): void;
  clear(): void;
  count(label?: string): void;
  debug(message?: any, ...optionalParams: any[]): void;
  dir(value?: any, ...optionalParams: any[]): void;
  dirxml(value: any): void;
  error(message?: any, ...optionalParams: any[]): void;
  exception(message?: string, ...optionalParams: any[]): void;
  group(groupTitle?: string, ...optionalParams: any[]): void;
  groupCollapsed(groupTitle?: string, ...optionalParams: any[]): void;
  groupEnd(): void;
  info(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
  markTimeline(label?: string): void;
  profile(reportName?: string): void;
  profileEnd(reportName?: string): void;
  table(...tabularData: any[]): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  timeStamp(label?: string): void;
  timeline(label?: string): void;
  timelineEnd(label?: string): void;
  trace(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
}
