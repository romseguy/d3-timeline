define([
  'durandal/app',
  'backend/json',
  'models/appConfiguration',
  'helpers/notifications',
  'state', 'settings',
  'appPlugins/appDialog'
], function (app, json, AppConfiguration, snot, state, settings) {
  var start = function start(module) {
    app.title = pjson.window.title + ' Rev ' + pjson.version;

    app.configurePlugins({
      router: true,
      dialog: true
    });

    app.start().then(function () {
      app.setRoot(module);
    });
  };

  return function boot() {
    json.read(settings.appConfigurationPath).then(function (res) {
      settings.appConfiguration = new AppConfiguration(res);
    });

    state.initialize().then(function () {
      if (!settings.skipSplash || !settings.skipToProject) {
        start('navigation/splash');
      } else {
        state.currentProject(_.find(state.projects(), { name: settings.skipToProject }));
        start('navigation/shell');
      }
    }, function (err) {
      snot.notify(err, { type: 'error', position: 'top-center' });
      start('navigation/splash');
    });
  }
});
