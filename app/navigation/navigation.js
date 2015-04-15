define([
  'durandal/app',
  'navigation/shell',
  'helpers/notifications', 'settings'
], function (app, sh, snot, settings) {
  return {
    router: sh.router,
    isLoggedIn: sh.isLoggedIn,
    currentProject: sh.currentProject,
    reboot: sh.reboot,

    compositionComplete: function (view, parent) {
      if (settings.fullscreen()) {
        snot.notify('Press ESC to exit fullscreen mode.', { timeout: 3, type: 'info' });

        $(document).keyup(function (event) {
          if (event.keyCode == 27 && $('#btn-fullscreen').css('display') != 'block') {
            settings.fullscreen(false);
          }
        });
      }
    },

    isActive: function (moduleId) {
      var vm = this;

      if (!moduleId || _.isNull(vm.router.activeItem())) {
        return false;
      }

      if (vm.router.activeItem().__moduleId__ === moduleId) {
        return true;
      }

      var activeModuleId = vm.router.activeItem().parent;

      return !_.isUndefined(_.find(vm.getChildren(moduleId), { parent: activeModuleId }));
    },

    /**
     * Get the given route's children
     * @param moduleId
     * @return {Array}
     */
    getChildren: function (moduleId) {
      var children =  _.filter(this.router.navigationModel(), { 'parent': moduleId });
      //win.log('navigation/getChildren/name', moduleId, children);

      if (_.isEmpty(children)) {
        return [{
          title: 'No charts yet.',
          hash: '#'
        }]
      }

      return children;
    },

    registerFullscreen: function () {
      snot.closeAll();
      settings.fullscreen(true);
    },

    login: function () {
      app.showDialog('dialogs/login/index', {}, 'app', { keyboard: true });
    },

    logout: function () {
      this.isLoggedIn(false);
      sh.refresh(true, true);
      this.router.navigate('dashboard');
    }
  };
});
