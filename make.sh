COFFEE=coffee
RJS=lib/r.js

$COFFEE -o src/js -c `find src/coffee/ -name "*.coffee"`
$COFFEE -o src/js -c src/coffee/presentation/*.coffee
node $RJS -o src/app.build.js
# Add-on packages not included in ducttape.js

