define([
  'durandal/app',
  'helpers/notifications',
  'state', 'settings'
], function (app, snot, state, settings) {

  /**
   * @class SplashVM
   * @singleton
   */
  var SplashVM = {
    state: state,

    /**
     * @property {Boolean}
     */
    isLoggedIn: settings.isLoggedIn,

    /**
     * @property {Boolean}
     */
    isLoading: ko.observable(),

    /**
     * @property {String}
     */
    selectedProjectName: ko.observable(),

    /**
     * @property {String}
     */
    version: settings.version,

    binding: function () {
      var body = document.querySelector('body');
      body.className += 'splash-bg';
      this.isLoading(false);
    },

    newProject: function () {
      app.showDialog('dialogs/configuration/project', {}, 'app', { fixedHeader: true });
    },

    load: function () {
      var vm = this;
      vm.isLoading(true);

      if (_.isEmpty(vm.selectedProjectName())) {
        snot.notify('Select a project to load first', { type: 'error' });
        vm.isLoading = false;
      }

      var p = state.getProject(vm.selectedProjectName());

      if (_.isUndefined(p)) {
        snot.notify('Project not found', { type: 'error' });
        vm.isLoading(false);
      }

      if (_.isEmpty(p.dataSourceGroups)) {
        snot.notify('The project does not have any configured data source.', { type: 'error' });
        vm.isLoading(false);
      }

      state.currentProject(p);
      app.setRoot('navigation/shell');
    },

    deleteProject: function () {
      var vm = this;
      var oldProjectName = vm.selectedProjectName();

      if (_.isEmpty(oldProjectName)) {
        snot.notify('Select a project to delete first', { type: 'error' });
        return;
      }

      app.showMessage('All data sources and charts configurations will be lost.', 'Do you really want to DELETE project ' + oldProjectName + '?', ['Yes', 'No']).then(function (selectedOption) {
        if (selectedOption === 'No') {
          return;
        }
        fs.remove(settings.configDirectoryPath + '/' + oldProjectName, function (err) {
          if (err) {
            snot.notify('Could not remove project ' + oldProjectName + ' from disk. ' + err, {
              timeout: 5,
              type: 'error'
            });
            return;
          }
          if (!state.removeProject(oldProjectName)) {
            snot.notify('Could not remove project ' + oldProjectName + ' from application memory.', {
              timeout: 5,
              type: 'error'
            });
            return;
          }
          snot.notify('The project ' + oldProjectName + ' has been deleted.', { timeout: 5 });
        });
      });
    },

    login: function () {
      app.showDialog('dialogs/login/index', {}, 'app', { keyboard: true });
    },

    configuration: function () {
      app.showDialog('dialogs/configuration/index', {}, 'app', { keyboard: true });
    }
  };

  return SplashVM;
});