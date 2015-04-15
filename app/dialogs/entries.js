define([
  'durandal/app',
  'helpers/notifications',
  'helpers/datasourcegroups'
], function (app, snot, dataSourceGroupsHelper) {
  return {
    displayName: '',

    data: ko.observableArray(),

    dataColumns: [],

    /**
     * @param {Object} activationData
     * @param {String} activationData.action
     * @param {DataSource} activationData.dataSource
     * @param {Entry[]} activationData.dataSource.data
     * @param {Boolean} activationData.dataSource.multiple
     * Meaning the dataSource.data comes from multiple data source groups
     * @param {DataSourceGroup[]} [activationData.dataSourceGroups]
     * @param {DataSourceGroup|DataSourceGroupForm} [activationData.dataSourceGroup]
     * @param {String[]} [activationData.dataColumns]
     * The dataSourceGroup's data columns nameVM that we want to display
     * activationData.dataSourceGroups or activationData.dataSourceGroup required
     */
    canActivate: function (activationData) {
      var vm = this;
      var debug = 'dialogs/entries/canActivate';

      if (_.isEmpty(activationData)
        || !_.isString(activationData.action)
        || !_.isArray(activationData.dataSource.data) || _.isEmpty(activationData.dataSource.data)
      ) {
        win.error(debug + '/fail', activationData);
        return false;
      }

      var originalData = activationData.dataSource.data;

      var doAction = {
        showAll: function () {
          vm.displayName = ' entries';
          vm.data(originalData);
        },
        showValid: function () {
          vm.displayName = ' valid entries';
          vm.data(_.filter(originalData, function (entry) {
            return _.contains(_.difference(
              _.flatten(originalData, 'id'),
              _.flatten(activationData.dataSource.partialData, 'id')
            ), entry.id);
          }));
        },
        showPartial: function () {
          vm.displayName = ' incomplete entries';
          vm.data(activationData.dataSource.partialData);
        },
        showVisibleData: function () {
          vm.displayName += ' visible entries';

          vm.dataColumns.push({
            name: 'Progress',
            nameVM: 'progress'
          });

          vm.data(originalData);
        }
      };

      doAction[activationData.action]();
      vm.displayName = vm.data().length + vm.displayName;

      if (_.isEmpty(vm.data())) {
        snot.notify('No data to display', { type: 'error' });
        return false;
      }

      return true;
    },

    activate: function (activationData) {
      var dataSourceGroup = !_.isUndefined(activationData.dataSourceGroups) && !activationData.dataSource.multiple ?
        _.find(uw(activationData.dataSourceGroups), function (dataSourceGroup) {
          return _.contains(uw(dataSourceGroup.dataSources), activationData.dataSource);
        }) :
        activationData.dataSourceGroup;

      if (!_.isUndefined(dataSourceGroup)) {
        var dc = dataSourceGroup.dataColumnForms ? dataSourceGroup.dataColumnForms : dataSourceGroup.dataColumns;

        this.dataColumns = _.cloneDeep(uw(dc))
          .filter(function (dataColumn) {
            // filter out disabled or unwanted data columns
            if (!_.isUndefined(activationData.dataColumns)) {
              return _.contains(activationData.dataColumns, uw(dataColumn.nameVM));
            } else {
              return !uw(dataColumn.disabled);
            }
          })
          .map(function (dataColumn) {
            // unwrap observables so we deal with attributes easily in the view
            Object.keys(dataColumn).forEach(function (key) {
              dataColumn[key] = uw(dataColumn[key]);
            });
            return dataColumn;
          });
      } else {
        // merge data columns from dataSourceGroups
        if (!_.isUndefined(activationData.dataSourceGroups) && activationData.dataSource.multiple) {
          this.dataColumns = uw(activationData.dataSourceGroups).map(function (dataSourceGroup) {
            return uw(dataSourceGroup.dataColumns);
          }).reduce(function (previous, current) {
            return previous.concat(current);
          }).filter(function (dataColumn) {
            return !dataColumn.disabled;
          });
          this.dataColumns = _.uniq(this.dataColumns, 'nameVM');
        } else {
          this.dataColumns = dataSourceGroupsHelper.getDataColumns();
        }
      }

    },

    closeDialog: function () {
      app.closeDialog(this);
    }
  };
});
