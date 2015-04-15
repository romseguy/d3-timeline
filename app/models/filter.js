define(['helpers/objects'], function (objects) {
  /**
   * @class Filter
   */
  var Filter = {
    /**
     * @param {Object} settings
     * @param {String} settings.name
     * @param {String[]} settings.selectedDataSourceGroups
     * @param {String} settings.byid
     * @param {String} settings.byName
     * @param {string[]} settings.selectedEntries
     */
    constructor: function (settings) {
      /**
       * @property {String}
       */
      this.name = settings.name || '';

      /**
       * @property {String[]}
       */
      this.selectedDataSourceGroups = settings.selectedDataSourceGroups || [];

			/**
       * @property {String}
       */
			this.byId = settings.byId || '';
			
			/**
       * @property {String}
       */
			this.byName = settings.byName || '';

      /**
       * @property {String[]}
       */
      this.selectedEntries = settings.selectedEntries || [];
    }
  };

  return objects.defclass(Filter);
});