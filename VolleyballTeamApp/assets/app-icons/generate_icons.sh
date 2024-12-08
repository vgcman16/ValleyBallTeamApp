#!/bin/bash

# Create the AppIcon.appiconset directory if it doesn't exist
mkdir -p ../ios/VolleyballTeamApp/Images.xcassets/AppIcon.appiconset

# Generate all required sizes
rsvg-convert -w 40 -h 40 AppIcon.svg > ../ios/VolleyballTeamApp/Images.xcassets/AppIcon.appiconset/Icon-40.png
rsvg-convert -w 60 -h 60 AppIcon.svg > ../ios/VolleyballTeamApp/Images.xcassets/AppIcon.appiconset/Icon-60.png
rsvg-convert -w 58 -h 58 AppIcon.svg > ../ios/VolleyballTeamApp/Images.xcassets/AppIcon.appiconset/Icon-58.png
rsvg-convert -w 87 -h 87 AppIcon.svg > ../ios/VolleyballTeamApp/Images.xcassets/AppIcon.appiconset/Icon-87.png
rsvg-convert -w 80 -h 80 AppIcon.svg > ../ios/VolleyballTeamApp/Images.xcassets/AppIcon.appiconset/Icon-80.png
rsvg-convert -w 120 -h 120 AppIcon.svg > ../ios/VolleyballTeamApp/Images.xcassets/AppIcon.appiconset/Icon-120.png
rsvg-convert -w 180 -h 180 AppIcon.svg > ../ios/VolleyballTeamApp/Images.xcassets/AppIcon.appiconset/Icon-180.png
rsvg-convert -w 1024 -h 1024 AppIcon.svg > ../ios/VolleyballTeamApp/Images.xcassets/AppIcon.appiconset/Icon-1024.png
