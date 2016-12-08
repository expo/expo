    # Generated postinstall: ReactABI10_0_0
    if target.pod_name == 'ReactABI10_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI10_0_0kNeverRequested','-DkNeverProgressed=ReactABI10_0_0kNeverProgressed','-DZINDEX_DEFAULT=ReactABI10_0_0ZINDEX_DEFAULT','-DZINDEX_STICKY_HEADER=ReactABI10_0_0ZINDEX_STICKY_HEADER','-DgCurrentGenerationCount=ReactABI10_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI10_0_0gPrintSkips','-DgPrintChanges=ReactABI10_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI10_0_0layoutNodeInternal','-DgDepth=ReactABI10_0_0gDepth','-DgPrintTree=ReactABI10_0_0gPrintTree','-DisUndefined=ReactABI10_0_0isUndefined','-DSINGLE_FRAME_INTERVAL=ReactABI10_0_0SINGLE_FRAME_INTERVAL']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI10_0_0RCT_DEV=1'
      end
    end
    # End generated postinstall
