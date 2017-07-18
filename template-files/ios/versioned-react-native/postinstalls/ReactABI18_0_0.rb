
    # Generated postinstall: ReactABI18_0_0
    if target.pod_name == 'ReactABI18_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI18_0_0kNeverRequested','-DkNeverProgressed=ReactABI18_0_0kNeverProgressed','-DZINDEX_DEFAULT=ReactABI18_0_0ZINDEX_DEFAULT','-DZINDEX_STICKY_HEADER=ReactABI18_0_0ZINDEX_STICKY_HEADER','-DSINGLE_FRAME_INTERVAL=ReactABI18_0_0SINGLE_FRAME_INTERVAL','-DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI18_0_0kSMCalloutViewRepositionDelayForUIScrollView','-DregionAsJSON=ReactABI18_0_0regionAsJSON','-DunionRect=ReactABI18_0_0unionRect','-DJSNoBytecodeFileFormatVersion=ReactABI18_0_0JSNoBytecodeFileFormatVersion','-DJSSamplingProfilerEnabled=ReactABI18_0_0JSSamplingProfilerEnabled','-DgCurrentGenerationCount=ReactABI18_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI18_0_0gPrintSkips','-DgPrintChanges=ReactABI18_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI18_0_0layoutNodeInternal','-DgDepth=ReactABI18_0_0gDepth','-DgPrintTree=ReactABI18_0_0gPrintTree','-DisUndefined=ReactABI18_0_0isUndefined','-DgNodeInstanceCount=ReactABI18_0_0gNodeInstanceCount']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI18_0_0RCT_DEV=1'
        # needed for GoogleMaps 2.x
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= []
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Base/Frameworks'
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Maps/Frameworks'
      end
    end
    # End generated postinstall
