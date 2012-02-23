# For building dtmain
coffee -o src/js -c src/coffee/*
node ~/.node_libraries/.npm/requirejs/1.0.5/package/bin/r.js -o src/js/app.build.js
# Add-on packages not part of dtmain
coffee -o build/js -c pkg/*.coffee

