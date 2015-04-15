define(['d3', 'settings'], function (d3, settings) {
  return {
    getVmName: function (viewName) {
      var toVmName = {
        Date: 'date'
      };

      return toVmName[viewName];
    },

    getViewName: function (vmName) {
      var toViewName = {
        date: 'Date'
      };

      return toViewName[vmName];
    },

    /**
     * @returns {Object[]}
     */
    getDataColumns: function () {
      return [{
        name: 'Entry Number' ,
        nameVM: 'id',
        value: 'Number'
      }, {
        name: 'Entry Name',
        nameVM: 'name',
        value: 'Description'
      }, {
        name: 'Date',
        nameVM: 'date',
        value: 'Date',
        format: 'YYYY-MM-DD'
      }, {
        name: 'Progress',
        nameVM: 'progress',
        value: 'Progress'
      }];
    },

    /**
     * @param {DataSourceGroup[]} dataSourceGroups
     * @param {String|String[]} dateField
     * @returns {Object} the min and max selected date across the data source groups
     */
    getMinMaxDates: function (dataSourceGroups, dateField) {
      var vm = this;

      var minmax = dataSourceGroups.map(function (dataSourceGroup) {
        for (var i = 0; i < dataSourceGroup.dataSources.length; i++) {
          var dataSource = dataSourceGroup.dataSources[i];
          var dates = [];

          if (_.isArray(dateField)) {
            dateField.forEach(function (df) {
              dates = dates.concat(vm.getDatesForDataSource(dataSourceGroup, dataSource, df));
            });
          } else {
            dates = vm.getDatesForDataSource(dataSourceGroup, dataSource, dateField);
          }

          var extent = d3.extent(dates, function (d) {
            return moment(d, settings.appConfiguration.dateFormat).toDate();
          });

          return {
            min: extent[0],
            max: extent[1]
          }
        }
      });

      return {
        min: moment(d3.min(_.pluck(minmax, 'min'))),
        max: moment(d3.max(_.pluck(minmax, 'max')))
      };
    },

    /**
     * @param {DataSourceGroup} dataSourceGroup
     * @param {DataSource} dataSource
     * @param {String} dateField
     */
    getDatesForDataSource: function (dataSourceGroup, dataSource, dateField) {
      var vm = this;

      return dataSource.data.map(function (entry) {
        var date = entry[vm.getVmName(dateField)];

        if (date.isValid) {
          return date.value;
        }
      }).filter(function (date) {
        return !_.isUndefined(date);
      });
    }
  };
});