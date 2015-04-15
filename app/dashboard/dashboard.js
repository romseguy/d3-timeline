define([
  'durandal/app', 'plugins/router',
  'state', 'helpers/notifications', 'settings',
  'backend/excel',
  'models/excelsource', 'models/entry',
  'helpers/objects'
], function (app, router, state, snot, settings, ExcelBindings, ExcelSource, Entry, objects) {

  /**
   * @class DashboardVM
   */
  var DashboardVM = {
    constructor: function () {
      /**
       * @property {String}
       */
      this.displayName = 'Setup';

      /**
       * @property {Boolean}
       */
      this.isLoggedIn = settings.isLoggedIn;

      /**
       * @property {DataSourceGroup[]}
       */
      this.dataSourceGroups = ko.observableArray();

      /**
       * @property {Boolean}
       */
      this.isLoading = ko.observable(false);

      /**
       * @property {String[]}
       */
      this.loadingErrors = [];
    },

    /**
     * Loops through the current project data sources
     * and process them depending on their type
     * @param {Object} [activationData]
     * @param {Boolean} [activationData.force]
     */
    activate: function (activationData) {
      activationData = activationData || {};
      var vm = this;

      if (activationData.force) {
        vm.dataSourceGroups([]);
      }

      var loadedDataSourceGroups = state.currentProject().dataSourceGroups.map(function (dataSourceGroup) {
         return vm.loadDataSourceGroup(dataSourceGroup, activationData.force);
      });

      return RSVP.all(loadedDataSourceGroups).then(function (dataSourceGroups) {
        win.log('dashboard/activate/loadedDataSourceGroups/all', dataSourceGroups.length);
        vm.isLoading(false);
        vm.dataSourceGroups(dataSourceGroups);
      });
    },

    /**
     * @param {DataSourceGroup} dataSourceGroup
     * @param {Boolean} forceLoad
     * @returns {RSVP.Promise}
     */
    loadDataSourceGroup: function (dataSourceGroup, forceLoad) {
      var vm = this;
      var debug = dataSourceGroup.name + '/dashboard/loadDataSourceGroup';
      win.log(debug);

      return new RSVP.Promise(function (resolve, reject) {
        var loadedDataSources = dataSourceGroup.dataSources.map(function (dataSource) {
          return vm.loadDataSource(dataSourceGroup, dataSource, forceLoad);
        });

        RSVP.allSettled(loadedDataSources).then(function (promises) {
          promises.forEach(function (promise) {
            switch (promise.state) {
              case 'fulfilled':
                win.log(debug + '/allSettled/resolved');
                var dataSource = promise.value;
                dataSource.partialData = _.filter(dataSource.data, function (entry) {
                  return !entry.date.isValid;
                });
                break;
              case 'rejected':
                win.log(debug + '/allSettled/rejected');

                if (promise.reason) {
                  vm.loadingErrors.push(promise.reason);
                }

                break;
            }
          });
        });

        RSVP.all(loadedDataSources).then(function (dataSources) {
          win.log(debug + '/all', dataSources);
          dataSourceGroup.data = dataSources[0].data;
          resolve(dataSourceGroup);
        });
      }).catch(function errorLoadingDataSourceGroup (err) {
        win.error(err);
      });
    },

    /**
     * @param {DataSourceGroup} dataSourceGroup
     * @param {ExcelSource} dataSource
     * @param {Boolean} forceLoad
     * @returns {RSVP.Promise}
     */
    loadDataSource: function (dataSourceGroup, dataSource, forceLoad) {
      var debug = dataSourceGroup.name + '/dashboard/loadDataSource/' + dataSource.name;
      win.log(debug);

      return new RSVP.Promise(function (resolve, reject) {
        if (!forceLoad && !_.isEmpty(dataSource.data) || !_.isNull(dataSource.err)) {
          win.log(debug + '/alreadyLoaded');
          resolve(dataSource);
          return;
        }

        win.log(debug + '/loading');

        if (dataSource instanceof ExcelSource) {
          var excel = new ExcelBindings(dataSource, dataSourceGroup);

          excel.loadDataSource().then(function (excelSource) {
            resolve(excelSource);
          }, function (err) {
            reject(err);
          });
        }
      }).catch(function errorLoadingDataSource (err) {
        win.error(err);
      });
    },

    deactivate: function () {
      this.loadingErrors = [];
    },

    compositionComplete: function () {
      if (!_.isEmpty(this.loadingErrors)) {
        snot.notify(this.loadingErrors, { type: 'error' });
      }

      $("[data-toggle='tooltip']").tooltip();
    },

    /* VIEW HELPERS */

    /**
     * @param dataSource
     * @param event
     */
    showData: function (dataSource, event) {
      var vm = this;

      app.showDialog('dialogs/entries', {
        action: event.target.dataset.action,
        dataSource: dataSource,
        dataSourceGroups: vm.dataSourceGroups
      }, 'app', {
        fixedHeader: true,
        keyboard: true
      });
    },

    /**
     * Appends a new data source group
     * @param {String} type='excel'
     */
    append: function (type) {
      win.log('dashboard/append', type);
      app.showDialog('dialogs/configuration/datasourcegroup', type, 'app', { fixedHeader: true });
    },

    /**
     * Configure a data source group
     * @param {DataSourceGroup} dataSourceGroup
     */
    configure: function (dataSourceGroup) {
      //win.log('dashboard/configure', dataSourceGroup);

      app.showDialog('dialogs/configuration/datasourcegroup', dataSourceGroup, 'app', { fixedHeader: true });
    },

    isExcelSource: function (dataSource) {
      return dataSource instanceof ExcelSource;
    },

    refresh: function () {
      this.isLoading(true);
      router.activeItem().activate({ force: true });
    }
  };

  return objects.defclass(DashboardVM);
});