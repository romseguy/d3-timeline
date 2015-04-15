define([
  'helpers/objects',
  'backend/json',
  'settings',
  'models/datasourcegroup',
  'models/timeline'
], function (objects, json, settings, DataSourceGroup, Timeline) {
  var chartCtor = {
    'timeline': Timeline
  };

  /**
   * @class Project
   * Project configuration data model
   */
  var Project = {
    /**
     * @param {Object} data
     * @param {Function|String} data.name
     * @param {Object[]|Function} data.dataSourceGroups
     * @param {Object[]} [data.timeline]
     */
    constructor: function (data) {
      //win.log('models/project/new/in', data);

      /**
       * @property {String}
       */
      this.name = uw(data.name);

      /**
       * @property {DataSourceGroup[]}
       */
      this.dataSourceGroups = uw(data.dataSourceGroups).map(function (dataSourceGroup) {
        return new DataSourceGroup(dataSourceGroup);
      });

      _.forEach(settings.charts, function (chartType) {
        this[chartType] = [];

        _.forEach(data[chartType], function (chart) {
          this.addChartCfg(chartType, chart);
        }, this)
      }, this);

      //win.log('models/project/new/out', this);
    },

    getCfgPath: function () {
      return settings.configDirectoryPath + '/' + this.name + '/settings.json';
    },

    /**
     * @param {DataSourceGroup} dsg
     */
    addDataSourceGroup: function (dsg) {
      if (_.isUndefined(this.getDataSourceGroup(dsg.name))) {
        this.dataSourceGroups.push(dsg);
      } else {
        this.dataSourceGroups = this.dataSourceGroups.map(function (dataSourceGroup) {
          return dataSourceGroup.name === dsg.name ? dsg : dataSourceGroup;
        });
      }
    },

    /**
     * @param {String|String[]} name
     * @return {DataSourceGroup|DataSourceGroup[]|undefined}
     */
    getDataSourceGroup: function (name) {
      if (!_.isEmpty(name)) {
        if (_.isArray(name)) {
          return _.filter(this.dataSourceGroups, function (dataSourceGroup) {
            return _.contains(name, dataSourceGroup.name);
          });
        } else if (_.isString(name)) {
          return _.find(this.dataSourceGroups, { name: name });
        }
      }

      return undefined;
    },

    /**
     * @param {String} name
     * @return {Boolean} whether or not the data source group has been deleted
     */
    removeDataSourceGroup: function (name) {
      if (!_.isString(name)) {
        return false;
      }

      if (_.isUndefined(this.getDataSourceGroup(name))) {
        return false;
      }

      var oldCount = this.dataSourceGroups.length;
      this.dataSourceGroups = _.reject(this.dataSourceGroups, { name: name });

      return this.dataSourceGroups.length === oldCount - 1;
    },

    /**
     * @param {String} chartType
     * @param {Object} cfg
     */
    addChartCfg: function (chartType, cfg) {
      cfg = new chartCtor[chartType](cfg);

      if (_.isUndefined(this.getChartCfg(chartType, cfg.name))) {
        this[chartType].push(cfg);
      } else {
        this[chartType] = this[chartType].map(function (chart) {
          return chart.name === cfg.name ? cfg : chart;
        });
      }
    },

    /**
     * @param {String} chartType
     * @param {String} name
     * @returns {Chart|undefined}
     */
    getChartCfg: function (chartType, name) {
      if (!_.isEmpty(name)) {
        if (_.isArray(name)) {
          return _.filter(this[chartType], function (chart) {
            return _.contains(name, chart.name);
          });
        } else if (_.isString(name)) {
          return _.find(this[chartType], { name: name });
        }
      }

      return undefined;
    },

    /**
     * @param {String} chartType
     * @param {String} name
     * @returns {Boolean} whether or not the chart configuration has been deleted
     */
    removeChartCfg: function (chartType, name) {
      if (!_.isString(name)) {
        return false;
      }

      if (_.isUndefined(this.getChartCfg(chartType, name))) {
        return false;
      }

      var oldCount = this[chartType].length;
      this[chartType] = _.reject(this[chartType], { 'name': name });

      return this[chartType].length === oldCount - 1;
    },

    /**
     * Saves the current project configuration to file
     * @return {RSVP.Promise}
     */
    save: function () {
      return json.write(this.getCfgPath(), this.cloneForSave());
    },

    /**
     * Clones the current project
     * and remove the runtime properties we don't want to store on the file system
     * @return {Object} the cloned and cleaned up current project observable
     */
    cloneForSave: function () {
      return {
        name: this.name,
        dataSourceGroups: this.dataSourceGroups.map(function (dataSourceGroup) {
          return dataSourceGroup.toJson();
        }),
        timeline: this.timeline.map(function (timeline) {
          return timeline.toJson();
        })
      };
    }
  };

  return objects.defclass(Project);
});