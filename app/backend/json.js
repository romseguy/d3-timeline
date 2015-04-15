define([], function () {
  var promiseReadJson = RSVP.denodeify(fs.readJson);
  var promiseOutputJson = RSVP.denodeify(fs.outputJson);

  /**
   * @class JsonBindings
   */
  var JsonBindings = {
    /**
     * @param {String} path
     * @return {RSVP.Promise}
     */
    read: function (path) {
      var debug = 'backend/json/read';

      return promiseReadJson(path)
        .then(function (res) {
          win.log(debug, path, res);
          return res;
        }, function (err) {
          win.error(debug, path, err);
          throw err;
        });
    },

    /**
     * @param {String} path
     * @param {Object} content
     * @return {RSVP.Promise}
     */
    write: function (path, content) {
      var debug = 'backend/json/write';

      return promiseOutputJson(path, content)
        .then(function () {
          win.log(debug, path, content);
        }, function (err) {
          win.error(debug, path, err);
          throw err;
        });
    }
  };

  return JsonBindings;
});