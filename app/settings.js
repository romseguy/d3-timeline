define([
  'models/color'
], function (Color) {
  /**
   * @class Settings
   * @singleton
   */
  var Settings = {
    /**
     * @property {Boolean}
     */
    devMode: pjson.dev_mode,

    /**
     * @property {String}
     */
    version: pjson.version,

    /**
     * @property {Boolean}
     * Use skipToProject to land directly into the specified project if in development mode
     */
    skipSplash: pjson.dev_mode && pjson.skip_splash,

    /**
     * @property {String}
     */
    skipToProject: pjson.skip_to_project,

    /**
     * @property {String[]}
     */
    charts: ['timeline'],

    /**
     * @property {Boolean}
     */
    isLoggedIn: ko.observable(pjson.dev_mode),

    /**
     * @property {Boolean}
     */
    fullscreen: ko.observable(false),

    /**
     * @property {String}
     */
    configDirectoryPath: gui.App.dataPath + '/cfg',

    /**
     * @property {String}
     */
    appConfigurationPath: gui.App.dataPath + '/cfg/app.json',

    /**
     * A reference to the model of the app.json configuration file
     * @property {Appconfiguration}
     */
    appConfiguration: null,

    /**
     * @property {Color[]}
     */
    defaultColors: [
      new Color({ name: 'Progress 100%', hex: '#11FF11', start: 100, end: 100 }),
      new Color({ name: 'Progress Interval 4', hex: '#CEE916', start: 98, end: 100 }),
      new Color({ name: 'Progress Interval 3', hex: '#FFFF00', start: 80, end: 98 }),
      new Color({ name: 'Progress Interval 2', hex: '#FFA600', start: 50, end: 80 }),
      new Color({ name: 'Progress Interval 1', hex: '#E0671F', start: 0, end: 50 }),
      new Color({ name: 'Progress 0%', hex: '#FF0000', start: 0, end: 0 })
    ]
  };

  return Settings;
});