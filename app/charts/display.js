define([
  'plugins/router', 'd3',
  'state', 'helpers/notifications', 'settings',
  'helpers/objects',
  'models/timeline',
  'charts/timeline/chart'
], function (router, d3, state, snot, settings, objects, Timeline, TimelineChart) {

  var chartCfg = null;
  var chart = null;

  var chartCtor = function () {
    if (chartCfg instanceof Timeline) {
      return TimelineChart;
    }
  };

  /**
   * @class ChartDisplayVM
   */
  var ChartDisplayVM = {
    constructor: function () {
      this.newExtent = ko.observableArray();
      this.filterTooltip = ko.observable('No filter');
    },

    /**
     * Checks if the chart configuration exists
     * and if its associated data source groups have data
     * @param {String} chartType
     * Type of the chart
     * @param {String} name
     * Name of the chart
     * @return {RSVP.Promise}
     */
    canActivate: function (chartType, name) {
      var vm = this;
      vm.parent = 'charts/' + chartType;
      vm.title = name;

      var checkChart = new RSVP.Promise(function (resolve, reject) {
        chartCfg = state.currentProject().getChartCfg(chartType, name);

        if (_.isUndefined(chartCfg)) {
          reject('Chart ' + name + ' not found');
        }

        chartCfg.dataSourceGroups = _.filter(state.currentProject().dataSourceGroups, function (dataSourceGroup) {
          return _.contains(chartCfg.dataSourceGroupNames, dataSourceGroup.name);
        });

        _.forEach(chartCfg.dataSourceGroups, function (dataSourceGroup) {
          if (_.isEmpty(dataSourceGroup.data)) {
            reject('The data source ' + dataSourceGroup.name + ' does not have any data.');
          }

          if (dataSourceGroup.hasError()) {
            reject('The data source ' + dataSourceGroup.name + ' has errors.');
          }
        });

        resolve(true);
      });

      return checkChart.catch(function (err) {
        snot.notify(err, { type: 'error' });
      })
    },

    /**
     * Compute and merge chart data according to current chart configuration
     */
    activate: function () {
      var vm = this;

      var dataSourceGroupsDataFiltered = chartCfg.dataSourceGroups.map(function (dataSourceGroup) {
        return vm.filterData(dataSourceGroup);
      });

      return RSVP.allSettled(dataSourceGroupsDataFiltered).then(function (promises) {
        var mergedData = [];

        promises.forEach(function (promise) {
          switch (promise.state) {
            case 'fulfilled':
              mergedData = mergedData.concat.apply(mergedData, promise.value);
              break;
          }
        });

        chartCfg.data = mergedData;
      });
    },

    /**
     * Displays the chart
     * @param view
     */
    attached: function (view) {
      var vm = this;
      var ctor = chartCtor();

      chart = new ctor(chartCfg.name, {
        container: d3.select(view).select('.chart'),
        miniHeight: 30,
        margin: {
          top: 10,
          right: 15,
          bottom: 0,
          left: 0
        }
      });

      chart.newExtent.subscribe(updateExtent);
      chart.currentFilter.subscribe(updateFilterTooltip);

      chart.init();

      function updateExtent (newExtent) {
        vm.newExtent(uw(newExtent).map(function (newDate) {
          return moment(newDate).format(settings.appConfiguration.dateFormat);
        }));
      }

      /**
       * @param {FilterForm} newFilter
       */
      function updateFilterTooltip (newFilter) {
        if (_.isNull(newFilter)) {
          vm.filterTooltip('No filter');
          return;
        }

        var tooltip = !_.isEmpty(newFilter.name()) ? ['Name: ' + newFilter.name()] : [];

        if (!_.isEmpty(newFilter.selectedDataSourceGroups())) {
          tooltip.push('Data Sources: ' + newFilter.selectedDataSourceGroups().map(function (sdsg) {
            return sdsg.name;
          }).join(', '));
        } else {
          tooltip.push('Data Sources: ' + chartCfg.dataSourceGroupNames.join(', '));
        }

        if (!_.isEmpty(newFilter.byId())) {
          tooltip.push('Entries number: ' + newFilter.byId());
        }

        if (!_.isEmpty(newFilter.byName())) {
          tooltip.push('Entries name: ' + newFilter.byName());
        }

        vm.filterTooltip(tooltip.join('<br>'));
      }
    },

    compositionComplete: function () {
    },

    deactivate: function () {
      $('.chart').hide();
      chart.cleanUp();
    },

    /**
     * Resolves data composed of entries between start and end dates
     * @param {DataSourceGroup} dataSourceGroup
     * @returns {RSVP.Promise}
     */
    filterData: function (dataSourceGroup) {
      var start = moment(chartCfg.startDate, settings.appConfiguration.dateFormat);
      var end = moment(chartCfg.endDate, settings.appConfiguration.dateFormat);
      var datesInRange = [];

      return new RSVP.Promise(function (resolve, reject) {
        resolve(dataSourceGroup.data.filter(function (entry) {
          entry.dataSourceGroup = dataSourceGroup;
          datesInRange = [];

          for (var i = 0; i < chartCfg.orderedBy.length; i++) {
            var date = entry[chartCfg.orderedBy[i]];

            if (date.isValid
              && moment(date.value, settings.appConfiguration.dateFormat)
                .within(moment().range(start, end))) {
              datesInRange.push(date);
            }
          }

          return _.some(datesInRange);
        }));
      });
    },

    /**
     * Helper method for the router
     * @return {String}
     */
    setTitle: function () {
      return 'Chart > ' + this.title;
    }
  };

  return objects.defclass(ChartDisplayVM);
});
