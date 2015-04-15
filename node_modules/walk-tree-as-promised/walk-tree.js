'use strict';

var fs = require('fs'),
    RSVP = require('rsvp');

module.exports = walk;
function walk(dir, options) {

  // Default options
  options = options || {};
  var processDirectory = options.processDirectory ||
    function(baseDir, relativePath, stat, entries, callback) {
      callback(null, Array.prototype.concat.apply([relativePath], entries));
    };
  var processFile = options.processFile ||
    function(baseDir, relativePath, stat, callback) {
      callback(null, [relativePath]);
    };

  var fsReaddir = options.sync ? fsReaddirSync : fs.readdir;
  var fsStat = options.sync ? fsStatSync : fs.stat;
  var before = RSVP.denodeify(options.before || function(cb) { cb(); });
  var after = RSVP.denodeify(options.after || function(r, cb) { cb(null, r); });


  function fly(relativePath, j, callback) {
    // Note: j is just an index that gets passed through (Needed for recursive calling)
    fsStat(dir + '/' + relativePath, function(err, stat) {
      if (err) { callback(err); return; }

      if (stat.isDirectory()) { // Directory
        if (relativePath !== '') { relativePath += '/'; }

        fsReaddir(dir + '/' + relativePath, function(err, entries) {
          if (err) { callback(err); return; }

          if (entries.length > 0) { // Full directory
            var entriesLeft = entries.length;
            for (var i = 0; i < entries.length; i++) {
              fly(relativePath + entries[i], i, function(err, subentries, i) {
                entries[i] = subentries;
                entriesLeft -= 1;
                if (entriesLeft === 0) {
                  processDirectory(dir, relativePath, stat, entries, function(err, result) {
                    if (err) { callback(err); } else { callback(null, result, j); }
                  });
                }
              });
            }
          } else { // Empty directory
            processDirectory(dir, relativePath, stat, entries, function(err, result) {
              if (err) { callback(err); } else { callback(null, result, j); }
            });
          }

        });

      } else if (stat.isFile()) { // File
        processFile(dir, relativePath, stat, function(err, result) {
          if (err) { callback(err); } else { callback(null, result, j); }
        });
      }

    });
  }


  return before().then(RSVP.denodeify(fly).bind(null, '')).then(after);
}

function fsReaddirSync(file, cb) { cb(null, fs.readdirSync(file)); }
function fsStatSync(file, cb) { cb(null, fs.statSync(file)); }
