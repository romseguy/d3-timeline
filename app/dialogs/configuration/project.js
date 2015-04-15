define([
  'durandal/app',
  'helpers/objects', 'helpers/strings',
  'forms/datasourcegroup', 'forms/excel',
  'models/excelsource',
  'state', 'helpers/notifications', 'settings'
], function (app, objects, strings, DataSourceGroupForm, ExcelForm, ExcelSource, state, snot, settings) {

  /**
   * @class ProjectConfigurationDialog
   */
  var ProjectConfigurationDialog = {
    constructor: function () {
      var vm = this;

      vm.projectName = ko.observable().extend(strings.getValidatedString('A project name is required.'));

      vm.projectName.subscribe(function (newValue) {
        vm.projectName(newValue.trim());
      });

      vm.dataSourceGroupForms = ko.observableArray().extend({
        minLength: {
          message: 'At least one data source is required'
        }
      });

      vm.dataSourceGroupFormsCount = ko.observable(0);

      vm.activeTab = ko.observable(0);

      vm.isLoading = ko.observable(false);

      vm.validationModel = ko.validatedObservable({
        projectName: vm.projectName,
        dataSourceGroupForms: vm.dataSourceGroupForms
      });

      this.isValid = function () {
        if (!vm.validationModel().isValid()) {
          vm.validationModel.errors.showAllMessages();
          snot.notify(vm.validationModel.errors(), { timeout: 5, type: 'error', position: 'top-center' });
          return false;
        }

        return true;
      };

    },

    displayName: 'New Project Configuration',

    canActivate: function () {
      snot.closeAll();
      return settings.isLoggedIn();
    },

    compositionComplete: function () {
      snot.focus('projectName');
    },

    closeDialog: function () {
      app.closeDialog(this);
    },

    clickedTab: function (dataSourceGroupForm) {
      this.activeTab(dataSourceGroupForm.id());
    },

    /**
     * @param {String} type
     */
    append: function (type) {
      var vm = this;

      vm.dataSourceGroupFormsCount(vm.dataSourceGroupFormsCount() + 1);
      vm.activeTab(vm.dataSourceGroupFormsCount());

      var dataSourceGroupForm = new DataSourceGroupForm({ id: vm.dataSourceGroupFormsCount(), newForm: true });
      dataSourceGroupForm.init({
        type: type
      });
      vm.dataSourceGroupForms.push(dataSourceGroupForm);
    },

    /**
     * @param {DataSourceGroupForm} dataSourceGroupForm
     */
    remove: function (dataSourceGroupForm) {
      var vm = this;
      var id = dataSourceGroupForm.id();

      if (vm.dataSourceGroupForms.remove(function (dataSourceGroupForm) {
        if (dataSourceGroupForm.id() === id) {
          dataSourceGroupForm.deactivate();
          return true;
        }

        return false;
      })) {
        vm.dataSourceGroupFormsCount(vm.dataSourceGroupFormsCount() - 1);

        if (vm.dataSourceGroupFormsCount() > 0) {
          vm.dataSourceGroupForms().forEach(function (dataSourceGroupForm, index) {
            dataSourceGroupForm.id(index + 1);
          });
        }

        vm.activeTab(id === 1 ? id : id - 1);
      }
    },

    /**
     * Saves the current configuration into the application and to a JSON file
     */
    save: function () {
      var vm = this;
      var debug = 'dialogs/configuration/project/save';

      vm.isLoading(true);
      snot.closeAll();

      if (!vm.isValid()) {
        vm.isLoading(false);
        return;
      }

      // all dataSourceGroupForms must be valid
      if (!vm.dataSourceGroupForms().every(function (dataSourceGroupForm) {
        return dataSourceGroupForm.isValid();
      })) {
        vm.isLoading(false);
        return;
      }

      var projectDirectoryPath = settings.configDirectoryPath + '/' + vm.projectName();

      fs.exists(projectDirectoryPath + '/settings.json', function (exists) {
        if (!exists) {
          proceed();
        } else {
          app.showMessage('All data sources and charts configurations will be lost.', 'Do you really want to overwrite the existing project ' + vm.projectName() + '?', ['Yes', 'No']).then(function (selectedOption) {
            if (selectedOption === 'Yes') {
              fs.remove(projectDirectoryPath, function (err) {
                if (!err) {
                  state.removeProject(vm.projectName());
                  proceed();
                }
                else {
                  snot.notify('File system error: could not remove old configuration directory for project ' + vm.projectName());
                  vm.isLoading(false);
                }
              });
            }
          });
        }
      });

      function proceed() {
        var loadedDataSourceGroupForms = vm.dataSourceGroupForms().map(function (dataSourceGroupForm) {
          return new RSVP.Promise(function (resolve, reject) {

            // validate dataSourceForms from current dataSourceGroupForm's forms
            var dataSources = dataSourceGroupForm.dataSourceForms().map(function (dataSourceForm) {
              if (dataSourceForm instanceof ExcelForm) {
                if (!uw(dataSourceForm.validFormat)) {
                  reject(new Error('Data Source n°' + dataSourceGroupForm.id() + ' error: please check Excel files before saving'));
                  return;
                }
              }

              return dataSourceForm.getDataSource();
            });

            // one of the dataSourceForms is not valid
            if (_.some(dataSources, function (dataSource) {
              return _.isUndefined(dataSource);
            })) {
              return;
            }

            // process them
            var processedDataSources = dataSources.map(function (dataSource) {
              return new RSVP.Promise(function (resolve, reject) {
                dataSource.data = [];

                if (dataSource instanceof ExcelSource) {
                  dataSource.filePath = projectDirectoryPath + '/DataSource_' + dataSourceGroupForm.name() + '_' + dataSource.worksheet + '.xlsx';

                  fs.copy(dataSource.originalFilePath, dataSource.filePath, function (err) {
                    if (!err) {
                      resolve(dataSource);
                    } else {
                      reject(new Error('System error: could not import ' + dataSource.worksheet + ' excel file for data source #' + dataSourceGroupForm.id()));
                    }
                  });
                }
              });
            });

            // resolve current dataSourceGroupForm
            RSVP.all(processedDataSources).then(function (dataSources) {
              dataSourceGroupForm.dataSources = dataSources;
              resolve();
            }, function (err) {
              reject(err);
            });
          });
        });

        // all dataSourceGroupForms are resolved
        RSVP.all(loadedDataSourceGroupForms).then(function () {
          win.log(debug + '/loadedDataSourceGroupForms');

          state
            .addProject({
              name: vm.projectName,
              dataSourceGroups: vm.dataSourceGroupForms
            })
              .save()
                .then(function () {
                  snot.notify('The project has been saved', { timeout: 5, position: 'top-center' });
                  vm.closeDialog();
                }, function (err) {
                  snot.notify('The project could not be written to the file system. ' + err.message, { type: 'error', position: 'top-center' });
                  vm.isLoading(false);
                });
        }, function (err) {
          snot.notify(err, { type: 'error', position: 'top-center' });
          vm.isLoading(false);
        }).catch(function errorSavingProject (err) {
          win.error(err);
        });
      }
    }
  };

  return objects.defclass(ProjectConfigurationDialog);
});