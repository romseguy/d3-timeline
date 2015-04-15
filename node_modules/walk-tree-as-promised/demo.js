var RSVP = require('rsvp'),
    walkSync = require('walk-sync'),
    walkTreeAsPromised = require('./walk-tree');

var folder = __dirname + '/../';


(function demo() {
  return RSVP.resolve()
  .then(runWalkSync)
  .then(runWalkTreeAsPromisedSync)
  .then(runWalkTreeAsPromised)
  .then(demo)
})();

var syncTotal = 0;
function runWalkSync() {
  var start = Date.now();
  var result = walkSync(folder);
  var duration = (Date.now() - start);
  syncTotal += duration;
  console.log('Sync took                   ' + duration + ' ms for ' + result.length + ' files, total: ' + syncTotal);
}

var promiseSyncTotal = 0;
function runWalkTreeAsPromised() {
  var start = Date.now()
  return walkTreeAsPromised(folder)
  .then(function(result) {
    var duration = (Date.now() - start);
    promiseSyncTotal += duration;
    console.log('walkTreeAsPromised took     ' + duration + ' ms for ' + result.length + ' files, total: ' + promiseSyncTotal);
  });
}

var promiseTotal = 0;
function runWalkTreeAsPromisedSync() {
  var start = Date.now()
  return walkTreeAsPromised(folder, {sync: true})
  .then(function(result) {
    var duration = (Date.now() - start);
    promiseTotal += duration;
    console.log('walkTreeAsPromisedSync took ' + duration + ' ms for ' + result.length + ' files, total: ' + promiseTotal);
  });
}