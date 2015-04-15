define(['helpers/objects'], function (objects) {
  /**
   * @class DataSource
   * @abstract
   */
  var DataSource = {
    /**
     * @param {Function|String} name
     */
    constructor: function (name) {
      //win.log('models/datasource/in', name);

      /**
       * @property {String}
       * Data source name
       */
      this.name = uw(name);

      /**
       * @property {Error}
       * The error that is displayed to the user on the dashboard
       */
      this.err = null;

      /**
       * @property {Entry[]}
       */
      this.partialData = [];

      //win.log('models/datasource/new/out', this);
    }
  };

  return objects.defclass(DataSource);
});