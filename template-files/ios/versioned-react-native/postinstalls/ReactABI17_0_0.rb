
    # Generated postinstall: ReactABI17_0_0
    if target.pod_name == 'ReactABI17_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI17_0_0kNeverRequested','-DkNeverProgressed=ReactABI17_0_0kNeverProgressed','-DZINDEX_DEFAULT=ReactABI17_0_0ZINDEX_DEFAULT','-DZINDEX_STICKY_HEADER=ReactABI17_0_0ZINDEX_STICKY_HEADER','-DSINGLE_FRAME_INTERVAL=ReactABI17_0_0SINGLE_FRAME_INTERVAL','-DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI17_0_0kSMCalloutViewRepositionDelayForUIScrollView','-DregionAsJSON=ReactABI17_0_0regionAsJSON','-DunionRect=ReactABI17_0_0unionRect','-DJSNoBytecodeFileFormatVersion=ReactABI17_0_0JSNoBytecodeFileFormatVersion','-DJSSamplingProfilerEnabled=ReactABI17_0_0JSSamplingProfilerEnabled','-DgCurrentGenerationCount=ReactABI17_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI17_0_0gPrintSkips','-DgPrintChanges=ReactABI17_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI17_0_0layoutNodeInternal','-DgDepth=ReactABI17_0_0gDepth','-DgPrintTree=ReactABI17_0_0gPrintTree','-DisUndefined=ReactABI17_0_0isUndefined','-DgNodeInstanceCount=ReactABI17_0_0gNodeInstanceCount']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI17_0_0RCT_DEV=1'
        config.build_settings['CLANG_WARN_DOCUMENTATION_COMMENTS'] = false
        # needed for GoogleMaps 2.x
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= []
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Base/Frameworks'
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Maps/Frameworks'
      end
    end
    # End generated postinstall
