    # Generated postinstall: ReactABI7_0_0
    if target.pod_name == 'ReactABI7_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI7_0_0kNeverRequested','-DkNeverProgressed=ReactABI7_0_0kNeverProgressed','-DZINDEX_DEFAULT=ReactABI7_0_0ZINDEX_DEFAULT','-DZINDEX_STICKY_HEADER=ReactABI7_0_0ZINDEX_STICKY_HEADER']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI7_0_0RCT_DEV=1'
      end
    end
    # End generated postinstall
