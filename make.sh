COFFEE=coffee
RJS=lib/r.js

$COFFEE -o src/js -c src/coffee/*
node $RJS -o src/js/app.build.js
# Add-on packages not included in ducttape.js
$COFFEE -o build/js -c pkg/*.coffee

