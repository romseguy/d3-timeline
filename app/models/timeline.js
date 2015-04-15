define([
  'helpers/objects',
  'settings',
  'models/chart', 'models/color'
], function (objects, settings, Chart, Color) {
  /**
   * @class Timeline
   * @extends Chart
   * Timeline configuration data model
   */
  var Timeline = {
    /**
     * @param {Object} data
     * @param {String} data.name
     * @param {String[]} data.dataSourceGroupNames
     * @param {String|String[]} data.orderedBy
     * @param {String} data.startDate
     * @param {String} data.endDate
     * @param {Object[]} data.colors
     * @param {Number} data.minimumDuration
     * @param {Number} data.weeksPadding
     * @param {Object[]} [data.filters]
     */
    constructor: function (data) {
      Chart.call(this, data);

      /**
       * @property {String[]}
       * Display entries according to this date field
       */
      this.orderedBy = _.isString(data.orderedBy) ? [ data.orderedBy ] : data.orderedBy;

      /**
       * @property {String} startDate
       * Display range lower date limit
       */
      var d = _.isString(data.startDate) ? moment(data.startDate, settings.appConfiguration.dateFormat) : moment(data.startDate);
      this.startDate = d.isValid() ? d.format(settings.appConfiguration.dateFormat) : '';

      /**
       * @property {String} endDate
       * Display range upper date limit
       */
      d = _.isString(data.endDate) ? moment(data.endDate, settings.appConfiguration.dateFormat) : moment(data.endDate);
      this.endDate = d.isValid() ? d.format(settings.appConfiguration.dateFormat) : '';

      /**
       * @property {Color[]}
       */
      this.colors = data['colors'].map(function (data) {
        return new Color(data);
      });

      /**
       * @property {Number}
       */
      this.minimumDuration = data.minimumDuration;

      /**
       * @property {Number}
       */
      this.weeksPadding = data.weeksPadding;
    },

    toJson: function () {
      return {
        name: this.name,
        dataSourceGroupNames: this.dataSourceGroupNames,
        orderedBy: this.orderedBy,
        startDate: this.startDate,
        endDate: this.endDate,
        colors: this.colors,
        minimumDuration: this.minimumDuration,
        weeksPadding: this.weeksPadding,
        filters: this.filters
      };
    }
  };

  return objects.extend(Chart, Timeline);
});