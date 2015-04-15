define(['helpers/objects', 'models/filter'], function (objects, Filter) {
  /**
   * @class Chart
   * @abstract
   */
  var Chart = {
    /**
     * @param {Object} data
     * @param {String} data.name
     * @param {String[]} data.dataSourceGroupNames
     */
    constructor: function (data) {
      /**
       * @property {String}
       */
      this.name = data.name || '';

      /**
       * @property {String[]}
       * Data source groups names the chart gets its data from
       */
      this.dataSourceGroupNames = data.dataSourceGroupNames;

      /**
       * @property {Filter[]}
       */
      this.filters = !_.isUndefined(data['filters']) ? data['filters'].map(function (data) {
        return new Filter(data);
      }) : [];
    },

    isUsingDataSourceGroup: function (name) {
      return _.contains(this.dataSourceGroupNames, name);
    },

    addFilter: function (data) {
      if (_.isEmpty(this.filters)) {
        this.filters = [];
      }

      if (_.isUndefined(this.getFilter(data.name))) {
        this.filters.push(new Filter(data));
      } else {
        this.filters = this.filters.map(function (filter) {
          return filter.name === data.name ? data : filter;
        });
      }
    },

    getFilter: function (name) {
      if (!_.isEmpty(name)) {
        if (_.isArray(name)) {
          return _.filter(this.filters, function (filter) {
            return _.contains(name, filter.name);
          });
        } else if (_.isString(name)) {
          return _.find(this.filters, { name: name });
        }
      }

      return undefined;
    },

    removeFilter: function (name) {
      if (!_.isString(name)) {
        return false;
      }

      if (_.isUndefined(this.getFilter(name))) {
        return false;
      }

      var oldCount = this.filters.length;
      this.filters = _.reject(this.filters, { 'name': name });

      return this.filters.length === oldCount - 1;
    }
  };

  return objects.defclass(Chart);
});