require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '15.1'
prepare_react_native_project!

target 'VolleyballTeamApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,
    :fabric_enabled => true
  )

  target 'VolleyballTeamAppTests' do
    inherit! :complete
  end

  post_install do |installer|
    react_native_post_install(installer)
  end
end
