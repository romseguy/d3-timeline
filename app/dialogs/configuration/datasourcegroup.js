define([
  'durandal/app', 'navigation/shell',
  'helpers/objects',
  'models/excelsource', 'models/datasourcegroup',
  'forms/datasourcegroup',
  'state', 'helpers/notifications', 'settings'
], function (app, sh, objects, ExcelSource, DataSourceGroup, DataSourceGroupForm, state, snot, settings) {
  /**
   * @property {DataSourceGroup}
   */
  var dataSourceGroup = null;

  /**
   * @class DataSourceGroupConfigurationVM
   */
  var DataSourceGroupConfigurationVM = {
    constructor: function () {
      var vm = this;

      /**
       * @property {Project}
       */
      vm.currentProject = state.currentProject;

      /**
       * @property {DataSourceGroupForm}
       */
      vm.dataSourceGroupForm = null;

      /**
       * @property {Boolean}
       */
      vm.isLoading = ko.observable(false);
    },

    canActivate: function (data) {
      return !_.isEmpty(data);
    },

    /**
     * @param {String|DataSourceGroup} data
     * An existing dataSourceGroup or the type of the dataSourceGroup to create
     */
    activate: function (data) {
      var vm = this;
      var debug = 'dialogs/configuration/datasourcegroup/activate';

      // new data source group
      if (_.isString(data)) {
        vm.dataSourceGroupForm = new DataSourceGroupForm();
        vm.dataSourceGroupForm.init({
          type: data
        });
      }
      // existing data source group
      else {
        dataSourceGroup = data;
        vm.dataSourceGroupForm = new DataSourceGroupForm({
          dataSourceGroup: dataSourceGroup
        });
        vm.dataSourceGroupForm.init({
          type: 'excel'
        });
      }
    },

    closeDialog: function () {
      app.closeDialog(this);
    },

    save: function () {
      var vm = this;
      vm.isLoading(true);

      // only check forms if we are creating a new data source group
      if (!vm.dataSourceGroupForm.isValid(_.isNull(dataSourceGroup))) {
        vm.isLoading(false);
        return;
      }

      var dsg = new DataSourceGroup(vm.dataSourceGroupForm);

      if (!_.isNull(dataSourceGroup)) {
        dsg.dataSources = dataSourceGroup.dataSources;
      }

      vm.currentProject().addDataSourceGroup(dsg);

      var dataSources = vm.dataSourceGroupForm.dataSourceForms().map(function (dataSourceForm) {
        return dataSourceForm.getDataSource();
      });

      var processedDataSources = dataSources.filter(function (dataSource) {
        return !_.isUndefined(dataSource); // if a new file wasn't provided
      }).map(function (dataSource) {
        return new RSVP.Promise(function (resolve, reject) {
          if (dataSource instanceof ExcelSource) {
            dataSource.filePath = settings.configDirectoryPath + '/' + vm.currentProject().name + '/DataSource_' + dsg.name + '_' + dataSource.worksheet + '.xlsx';

            // save a copy of the imported data sources' files into the project config dir
            fs.copy(dataSource.originalFilePath, dataSource.filePath, function (err) {
              if (!err) {
                resolve(dataSource);
              } else {
                reject(new Error('System error: could not save the new ' + dataSource.worksheet + ' excel file'));
              }
            });
          } else {
            resolve(dataSource);
          }
        });
      });

      RSVP.allSettled(processedDataSources).then(function (promises) {
        promises.forEach(function (promise) {
          switch (promise.state) {
            case 'fulfilled':
              var dataSource = promise.value;
              dsg.addDataSource(dataSource);
              break;
            case 'rejected':
              snot.notify(err, { type: 'error', position: 'top-center' });
              break;
          }
        });
      });

      RSVP.all(processedDataSources).then(function () {
        vm.currentProject().save().then(function () {
          vm.closeDialog();
          snot.alert('Data source ' + dsg.name + ' has been saved to the project configuration file. The application will now restart.').then(function () {
            sh.reboot();
          });
        }, function (err) {
          snot.notify('Data source ' + dsg.name + ' could not be saved to the project configuration file. ' + err, { type: 'error', position: 'top-center' });
          vm.isLoading(false);
        });
      });
    },

    remove: function () {
      var vm = this;
      var name = dataSourceGroup.name;
      var filePath = settings.configDirectoryPath + '/' + vm.currentProject().name + '/DataSource_' + name;

      var timelines = _.filter(vm.currentProject().timeline, function (timeline) {
        return timeline.isUsingDataSourceGroup(name);
      });

      if (!_.isEmpty(timelines)) {
        snot.notify('Data source ' + name + ' is used by ' + timelines.length + ' Timeline configuration and cannot be removed.', { type: 'error' });
        return;
      }

      dataSourceGroup.dataSources.forEach(function (dataSource) {
        if (dataSource instanceof ExcelSource) {
          filePath += '_' + dataSource.worksheet + '.xlsx';
        }

        fs.removeSync(filePath);
      });

      if (vm.currentProject().removeDataSourceGroup(name)) {
        vm.currentProject().save().then(function () {
          vm.closeDialog();
          snot.alert('Data source ' + dataSourceGroup.name + ' has been removed from the project configuration file. The application will now restart.').then(function () {
            sh.reboot();
          });
        }, function (err) {
          snot.notify('Data source ' + name + ' could not be removed from the project configuration file. ' + err, { type: 'error' });
        });
      } else {
        snot.notify('Data source ' + name + ' could not be removed from application memory. Restart the applications to resolve the issue.', { type: 'error' });
      }
    }
  };

  return objects.defclass(DataSourceGroupConfigurationVM);
});