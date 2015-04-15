define(['helpers/objects'], function (objects) {
  /**
   * @class Color
   */
  var Color = {
    /**
     * @param {Object} settings
     * @param {String} settings.name
     * @param {String} settings.hex
     * @param {Number} settings.start
     * @param {Number} settings.end
     */
    constructor: function (settings) {
      /**
       * @property {String}
       */
      this.name = settings.name || '';

      /**
       * @property {String}
       */
      this.hex = settings.hex || '';

      /**
       * @property {Number}
       */
      this.start = _.isUndefined(settings.start)? -1 : settings.start;

      /**
       * @property {Number}
       */
      this.end = _.isUndefined(settings.end)? -1 : settings.end;
    }
  };

  return objects.defclass(Color);
});