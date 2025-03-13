// TODO vonovak 3/25 - remove this and replace instantiations with RCTAppDependencyProvider
// when dispatch_once is removed from https://github.com/facebook/react-native/blob/f5feb73022f9340583ebcf576eaedd3ca5677e1a/packages/react-native/scripts/codegen/templates/RCTAppDependencyProviderMM.template#L51
// also replace "ReactCodegen" dependency in podspec with RCTAppDependencyProvider

#if __has_include(<React-RCTAppDelegate/RCTDependencyProvider.h>) || __has_include(<React_RCTAppDelegate/RCTDependencyProvider.h>)
#import <EXDevMenu/EXAppDependencyProvider.h>
#import <ReactCodegen/RCTModulesConformingToProtocolsProvider.h>
#import <ReactCodegen/RCTThirdPartyComponentsProvider.h>

@implementation EXAppDependencyProvider {
  NSArray<NSString *> * _URLRequestHandlerClassNames;
  NSArray<NSString *> * _imageDataDecoderClassNames;
  NSArray<NSString *> * _imageURLLoaderClassNames;
  NSDictionary<NSString *,Class<RCTComponentViewProtocol>> * _thirdPartyFabricComponents;
}

- (nonnull NSArray<NSString *> *)URLRequestHandlerClassNames {
  return RCTModulesConformingToProtocolsProvider.URLRequestHandlerClassNames;
}

- (nonnull NSArray<NSString *> *)imageDataDecoderClassNames {
  return RCTModulesConformingToProtocolsProvider.imageDataDecoderClassNames;
}

- (nonnull NSArray<NSString *> *)imageURLLoaderClassNames {
  return RCTModulesConformingToProtocolsProvider.imageURLLoaderClassNames;;
}

- (nonnull NSDictionary<NSString *,Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents {
  return RCTThirdPartyComponentsProvider.thirdPartyFabricComponents;
}

@end

#endif
