COFFEE=/Users/neumark/.npm/coffee-script/1.2.0/package/bin/coffee
RJS=/Users/neumark/.npm/requirejs/1.0.7/package/bin/r.js

$COFFEE -o src/js -c src/coffee/*
node $RJS -o src/js/app.build.js
# Add-on packages not included in ducttape.js
$COFFEE -o build/js -c pkg/*.coffee

