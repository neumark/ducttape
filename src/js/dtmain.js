define(["ducttape", "ui"], function(dt, ui) {
    // register DuckTape globally
    window["\u0111"] = dt;
    new ui();
});
