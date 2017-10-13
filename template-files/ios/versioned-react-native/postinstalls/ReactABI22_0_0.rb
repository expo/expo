
    # Generated postinstall: ReactABI22_0_0
    if target.pod_name == 'ReactABI22_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI22_0_0kNeverRequested','-DkNeverProgressed=ReactABI22_0_0kNeverProgressed','-DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI22_0_0kSMCalloutViewRepositionDelayForUIScrollView','-DregionAsJSON=ReactABI22_0_0regionAsJSON','-DunionRect=ReactABI22_0_0unionRect','-DJSNoBytecodeFileFormatVersion=ReactABI22_0_0JSNoBytecodeFileFormatVersion','-DJSSamplingProfilerEnabled=ReactABI22_0_0JSSamplingProfilerEnabled','-DRECONNECT_DELAY_MS=ReactABI22_0_0RECONNECT_DELAY_MS','-DgCurrentGenerationCount=ReactABI22_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI22_0_0gPrintSkips','-DgPrintChanges=ReactABI22_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI22_0_0layoutNodeInternal','-DgDepth=ReactABI22_0_0gDepth','-DgPrintTree=ReactABI22_0_0gPrintTree','-DisUndefined=ReactABI22_0_0isUndefined','-DgNodeInstanceCount=ReactABI22_0_0gNodeInstanceCount','-DMAX_DELTA_TIME=ReactABI22_0_0MAX_DELTA_TIME']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI22_0_0RCT_DEV=1'
        # needed for GoogleMaps 2.x
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= []
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Base/Frameworks'
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Maps/Frameworks'
      end
    end
    # End generated postinstall
