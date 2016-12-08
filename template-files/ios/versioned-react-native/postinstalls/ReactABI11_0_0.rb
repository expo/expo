    # Generated postinstall: ReactABI11_0_0
    if target.pod_name == 'ReactABI11_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI11_0_0kNeverRequested','-DkNeverProgressed=ReactABI11_0_0kNeverProgressed','-DZINDEX_DEFAULT=ReactABI11_0_0ZINDEX_DEFAULT','-DZINDEX_STICKY_HEADER=ReactABI11_0_0ZINDEX_STICKY_HEADER','-DgCurrentGenerationCount=ReactABI11_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI11_0_0gPrintSkips','-DgPrintChanges=ReactABI11_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI11_0_0layoutNodeInternal','-DgDepth=ReactABI11_0_0gDepth','-DgPrintTree=ReactABI11_0_0gPrintTree','-DisUndefined=ReactABI11_0_0isUndefined','-DSINGLE_FRAME_INTERVAL=ReactABI11_0_0SINGLE_FRAME_INTERVAL','-DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI11_0_0kSMCalloutViewRepositionDelayForUIScrollView']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI11_0_0RCT_DEV=1'
      end
    end
    # End generated postinstall
