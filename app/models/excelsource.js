define(['helpers/objects', 'models/datasource'], function (objects, DataSource) {
  /**
   * @class ExcelSource
   * @extends DataSource
   */
  var ExcelSource = {
    /**
     * @param {Object} settings
     * @param {String} settings.worksheet
     * @param {String} settings.originalFilePath
     * @param {String} [settings.filePath]
     * @param {String} [settings.name]
     */
    constructor: function (settings) {
      var vm = this;
      DataSource.call(vm, settings.worksheet);

      vm.originalFilePath = settings.originalFilePath;
      vm.filePath = settings.filePath || settings.originalFilePath;
      vm.worksheet = settings.worksheet;

      /**
       * @property {Date}
       */
      vm.modified = null;

      /**
       * @property {Entry[]}
       */
      vm.data = [];

      /**
       * @property {Object[]}
       */
      vm.rawData = [];

      /**
       * @property {Object[]}
       */
      vm.fileHeaders = [];

      /**
       * @type {DataSourceGroup|DataSourceGroupForm}
       */
      vm.dataSourceGroup = null;
    },

    toJson: function () {
      return {
        originalFilePath: this.originalFilePath,
        filePath: this.filePath,
        worksheet: this.worksheet
      };
    }
  };

  return objects.extend(DataSource, ExcelSource);
});