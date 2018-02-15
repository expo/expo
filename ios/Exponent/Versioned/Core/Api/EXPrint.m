//
//  EXPrint.m
//  Exponent
//
//  Created by Alicja Warchał on 07.02.2018.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import "EXPrint.h"
#import <React/RCTConvert.h>
#import <React/RCTUtils.h>

@interface EXPrint () <UIPrintInteractionControllerDelegate, UIPrinterPickerControllerDelegate>

@end

@implementation EXPrint

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE(ExponentPrint);

RCT_EXPORT_METHOD(print:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UIPrintInteractionController *printInteractionController = [self _makePrintInteractionControllerWithUri:options[@"uri"]];
  
  if (options[@"uri"]) {
    NSString *uri = [RCTConvert NSString:options[@"uri"]];
    NSData *printData = [self _dataFromUri:uri];
    if (printData) {
      printInteractionController.printingItem = printData;
    } else {
      NSString *message = [NSString stringWithFormat:@"The specified url is not valid for printing: %@", uri];
      reject(@"E_URL_INVALID", message, RCTErrorWithMessage(message));
      return;
    }
  }
  
  if (options[@"html"]) {
    NSString *htmlString = [RCTConvert NSString:options[@"html"]];
    if (htmlString != nil) {
      UIMarkupTextPrintFormatter *formatter = [[UIMarkupTextPrintFormatter alloc] initWithMarkupText:htmlString];
      printInteractionController.printFormatter = formatter;
    } else {
      NSString *message = [NSString stringWithFormat:@"The specified html string is not valid for printing."];
      reject(@"E_HTML_INVALID", message, RCTErrorWithMessage(message));
      return;
    }
  }
  
  NSURL *printerURL;
  UIPrinter *printer;
  if (options[@"printerUrl"]){
    printerURL = [NSURL URLWithString:[RCTConvert NSString:options[@"printerUrl"]]];
    printer = [UIPrinter printerWithURL:printerURL];
  }
  
  void (^completionHandler)(UIPrintInteractionController *, BOOL, NSError *) =
  ^(UIPrintInteractionController *printController, BOOL completed, NSError *error) {
    if (error != nil) {
      reject(@"E_CANNOT_PRINT", @"Printing job encountered an error.", error);
      return;
    }
    
    if (completed) {
      resolve(nil);
    } else {
      reject(@"E_PRINT_INCOMPLETE", @"Printing did not complete.", nil);
    }
  };
  
  if (printer != nil) {
    [printInteractionController printToPrinter:printer completionHandler:completionHandler];
  } else {
    [printInteractionController presentAnimated:YES completionHandler:completionHandler];
  }
}


RCT_EXPORT_METHOD(selectPrinter:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UIPrinterPickerController *printPicker = [UIPrinterPickerController printerPickerControllerWithInitiallySelectedPrinter:nil];
  
  printPicker.delegate = self;
  
  [printPicker presentAnimated:YES completionHandler:
   ^(UIPrinterPickerController *printerPicker, BOOL userDidSelect, NSError *error) {
     if (!userDidSelect && error) {
       reject(@"E_PRINTER_SELECT_ERROR", @"There was a problem with the printer picker.", error);
     } else {
       [UIPrinterPickerController printerPickerControllerWithInitiallySelectedPrinter:printerPicker.selectedPrinter];
       if (userDidSelect) {
         UIPrinter *pickedPrinter = printerPicker.selectedPrinter;
         resolve(@{
                   @"name" : pickedPrinter.displayName,
                   @"url" : pickedPrinter.URL.absoluteString,
                   });
       }
     }
   }];
}

#pragma mark - UIPrintInteractionControllerDelegate

- (UIViewController *)printInteractionControllerParentViewController:(UIPrintInteractionController *)printInteractionController
{
  return RCTPresentedViewController();
}

#pragma mark - internal

- (NSData *)_dataFromUri:(NSString *)uri
{
  NSURL *candidateURL = [NSURL URLWithString:uri];
  
  // iCloud url looks like: `file:///private/var/mobile/Containers/Data/Application/[...].pdf`
  // data url looks like: `data:application/pdf;base64,JVBERi0x...`
  BOOL isValidURL = (candidateURL && candidateURL.scheme);
  
  if (isValidURL) {
    // TODO: This needs updated to use NSURLSession dataTaskWithURL:completionHandler:
    return [NSData dataWithContentsOfURL:candidateURL];
  }
  return nil;
}

- (UIPrintInteractionController *)_makePrintInteractionControllerWithUri:(NSString *)uri
{
  UIPrintInteractionController *printInteractionController = [UIPrintInteractionController sharedPrintController];
  printInteractionController.delegate = self;
  
  UIPrintInfo *printInfo = [UIPrintInfo printInfo];
  
  printInfo.outputType = UIPrintInfoOutputGeneral;
  printInfo.jobName = [uri lastPathComponent];
  printInfo.duplex = UIPrintInfoDuplexLongEdge;
  
  printInteractionController.printInfo = printInfo;
  printInteractionController.showsPageRange = YES;
  return printInteractionController;
}

@end
