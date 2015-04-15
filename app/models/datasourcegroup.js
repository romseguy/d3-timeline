define([
  'helpers/objects',
  'models/datasource', 'models/excelsource', 'models/datacolumn'
], function (objects, DataSource, ExcelSource, DataColumn) {
  /**
   * @class DataSourceGroup
   * @extends DataSource
   */
  var DataSourceGroup = {
    /**
     * @param {DataSourceGroupForm|Object} data
     * @param {Function|String} [data.name]
     * @param {Function|Object[]} [data.dataColumns]
     * @param {Function|Object[]} [data.dataSources]
     */
    constructor: function (data) {
      DataSource.call(this, data.name || 'Untitled');
      //win.log('models/datasourcegroup/new/in', data);

      /**
       * @property {Object[]}
       */
      this.dataColumns = !_.isUndefined(data.dataColumnForms) ?
        data.dataColumnForms().map(function (dataColumn) {
          return new DataColumn(dataColumn);
        }) : data.dataColumns.map(function (dataColumn) {
        return new DataColumn(dataColumn);
      });

      /**
       * @property {DataSource[]}
       */
      this.dataSources = !_.isUndefined(data.dataSources) ?
        uw(data.dataSources).map(function (dataSource) {
          if (!(dataSource instanceof DataSource)) {
            dataSource = new ExcelSource(dataSource);
          }

          return dataSource;
        }) : [];

      /**
       * @property {Entry[]}
       */
      this.data = [];

      /**
       * @property {String}
       */
      this.backupDate = null;

      /**
       * @property {String}
       */
      this.lastRefresh = null;

      //win.log('models/datasourcegroup/new/out', this);
    },

    /**
     * @param {ExcelSource|Object} ds
     */
    addDataSource: function (ds) {
      var vm = this;

      if (!(ds instanceof DataSource)) {
        ds = new ExcelSource(ds);
      }

      if (_.isUndefined(this.getDataSource(ds.name))) {
        this.dataSources.push(ds);
      } else {
        this.dataSources = this.dataSources.map(function (dataSource) {
          return dataSource.name === ds.name ? ds : dataSource;
        });
      }
    },

    /**
     * @param {String|String[]} name
     * @return {DataSource|DataSource[]|undefined}
     */
    getDataSource: function (name) {
      if (!_.isEmpty(name)) {
        if (_.isArray(name)) {
          return _.filter(this.dataSources, function (dataSource) {
            return _.contains(name, dataSource.name);
          });
        } else if (_.isString(name)) {
          return _.find(this.dataSources, { name: name });
        }
      }

      return undefined;
    },

    /**
     * @param {String} name
     * @return {Boolean} whether or not the data source has been deleted
     */
    removeDataSource: function (name) {
      if (!_.isString(name)) {
        return false;
      }

      if (_.isUndefined(this.getDataSource(name))) {
        return false;
      }

      var oldCount = this.dataSources.length;
      this.dataSources = _.reject(this.dataSources, { name: name });

      return this.dataSources.length === oldCount - 1;
    },

    /**
     * @returns {Boolean}
     */
    hasError: function () {
      return !_.every(this.dataSources, { err: null });
    },

    toJson: function () {
      var vm = this;

      return {
        name: this.name,
        dataColumns: this.dataColumns.map(function (dataColumn) {
          return dataColumn.toJson();
        }),
        dataSources: this.dataSources.map(function (dataSource) {
          return dataSource.toJson();
        })
      }
    },

    dataToJson: function () {
      return JSON.stringify(this.data.map(function (entry) {
        delete entry.dataSourceGroup; // JSON cannot stringify circular structures
        return entry;
      }));
    }
  };

  return objects.extend(DataSource, DataSourceGroup);
});