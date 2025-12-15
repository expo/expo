<% if (!features.ios) { %>// __SKIP_FILE__<% } %>
Pod::Spec.new do |s|
  s.name           = '<%- project.name %>'
  s.version        = '1.0.0'
  s.summary        = '<%- project.description %>'
  s.description    = '<%- project.description %>'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
