#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTBridge.h>
#import <React/RCTLog.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"VolleyballTeamApp";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  // Enable more detailed React Native logging
  RCTSetLogThreshold(RCTLogLevelInfo);
  RCTSetLogFunction(^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
    NSLog(@"[RN Debug] %@", message);
  });

  RCTBundleURLProvider *urlProvider = [RCTBundleURLProvider sharedSettings];
  [urlProvider resetToDefaults];
  
  // Log current settings
  NSLog(@"Current jsLocation: %@", urlProvider.jsLocation);
  
  // Force the Metro port to 8081
  urlProvider.jsLocation = @"localhost:8081";
  
  // Get the bundle URL with our forced settings
  NSURL *url = [urlProvider jsBundleURLForBundleRoot:@"index"];
  
  NSLog(@"Using bundle URL: %@", url);
  
  return url;
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

@end
