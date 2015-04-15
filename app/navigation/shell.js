define([
  'durandal/app',
  'plugins/router',
  'helpers/notifications',
  'state', 'settings'
], function (app, router, snot, state, settings) {

  /**
   * @private
   * @property {Array}
   * Holds the routes used to navigate around the application
   */
  var routes = ko.observableArray();

  /**
   * @event
   * When the active router item changes: close notifications
   */
  router.activeItem.subscribe(function (newActiveItem) {
    //win.log('router/activeItem', newActiveItem);
    snot.closeAll();
  });

  /**
   * @override
   */
  router.updateDocumentTitle = function (instance, instruction) {
    if (instance.setTitle) {
      if (app.title) {
        document.title = app.title + " | " + instance.setTitle();
      } else {
        document.title = instance.setTitle();
      }
    }
    else if (instruction.config.title) {
      if (app.title) {
        document.title = app.title + " | " + instruction.config.title;
      } else {
        document.title = instruction.config.title;
      }
    } else if (app.title) {
      document.title = app.title;
    }
  };


  /**
   * @class ShellVM
   * @singleton
   *
   * Top level View Model whose main purpose is to handle routing and layout
   */
  var ShellVM = {
    /**
     * @property {Router}
     */
    router: router,

    /**
     * @property {Boolean}
     */
    isLoggedIn: settings.isLoggedIn,

    /**
     * @property {Boolean}
     */
    fullscreen: settings.fullscreen,

    /**
     * @property {Project}
     */
    currentProject: state.currentProject,

    activate: function () {
      var body = document.querySelector('body');
      body.className = '';

      this.initRoutes();
      return this.refresh();
    },

    deactivate: function () {
      snot.closeAll();
    },

    initRoutes: function () {
      routes([{
        route: ['', 'dashboard'],
        moduleId: 'dashboard/dashboard',
        title: 'Setup',
        icon: 'dashboard',
        nav: true
      }]);

      settings.charts.forEach(function (chartType) {
        routes().push({
          route: 'charts',
          moduleId: 'charts/' + chartType,
          title: _.capitalize(chartType),
          icon: 'bar-chart-o',
          nav: true,
          children: [
            {
              route: 'charts/configuration/:chartType',
              moduleId: 'charts/configuration',
              title: 'Configuration',
              nav: true,
              hash: '#charts/configuration/' + chartType,
              admin: true
            }
          ]
        })
      });
    },

    /**
     * Refresh the router's routes
     * @param {Boolean} [reset]
     * @param {Boolean} [silent]
     * @return {RSVP.Promise}
     */
    refresh: function (reset, silent) {
      reset = reset || false;
      silent = silent || false;

      var vm = this;

      if (reset) {
        vm.reset();
      }

      settings.charts.forEach(function (chartType) {
        vm.currentProject()[chartType].sort(function (s1, s2) {
          return s1.name > s2.name;
        }).forEach(function (chart) {
          routes.push({
            route: 'charts/display/:chartType/:name',
            moduleId: 'charts/display',
            title: chart.name,
            nav: true,
            hash: '#charts/display/' + chartType + '/' + chart.name,
            parent: 'charts/' + chartType
          });
        });
      });

      routes().forEach(function (route) {
        if ('children' in route) {
          //win.log('shell/pushChildrenToRoutes/route', route, 'has children');

          route.children.forEach(function (child) {
            if (child.admin && !vm.isLoggedIn()) {
              return;
            }

            //win.log('shell/pushChildrenToRoutes/child', child);

            if (_.isUndefined(_.find(routes(), { moduleId: route.moduleId, title: child.title }))) {
              child.parent = route.moduleId;
              routes.push(child);
              //win.log('shell/pushChildrenToRoutes/pushed', child);
            }
          });
        }
      });

      return router.map(routes()).buildNavigationModel().activate({ silent: silent });
    },

    /**
     * Reboot application to splash screen when clicking on the UI exit button
     * Deactivate the current module by navigating to the dashboard
     */
    reboot: function () {
      var activeItem = router.activeItem;

      if (!activeItem()) {
        root();
        return;
      }

      // navigate to dashboard before exiting so we land on it when loading a new project from the splash
      if (activeItem().__moduleId__ !== 'dashboard/dashboard') {
        router.navigate('dashboard', { trigger: false });
        root();
      } else {
        root();
      }

      function root() {
        window.location.reload();
      }
    },

    /**
     * Resets the router to its default state
     */
    reset: function () {
      router.reset();
      router.deactivate();
      this.initRoutes();
    }
  };

  return ShellVM;
});
