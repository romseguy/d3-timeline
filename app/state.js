define([
  'backend/json',
  'models/project',
  'helpers/strings',
  'settings'
], function (json, Project, strings, settings) {
  /**
   * @class State
   * @singleton
   */
  var State = {
    /**
     * @property {Project[]}
     */
    projects: ko.observableArray([]),

    /**
     * @property {Project}
     */
    currentProject: ko.observable(null),

    /**
     * Resets the application to its default state
     */
    reset: function () {
      this.projects([]);
      this.currentProject(null);
    },

    /**
     * Appends or replaces a project
     * @param {Object} data
     * @param {String|Function} data.name
     * @param {Object[]|Function} data.dataSourceGroups
     * @param {Object[]} [data.timelines]
     */
    addProject: function (data) {
      var p = this.getProject(data.name);
      var newP = new Project(data);

      if (_.isUndefined(p)) {
        this.projects.push(newP);
      } else {
        this.projects.replace(p, newP);
      }

      win.log('state/addProject/' + newP.name);
      return newP;
    },

    /**
     * @param {String|Function} name
     * @returns {Project|undefined}
     */
    getProject: function (name) {
      name = uw(name);

      if (!_.isString(name)) {
        return undefined;
      }

      return _.find(this.projects(), { name: name });
    },

    /**
     * @param {String} name
     * @return {Boolean} whether or not the project has been deleted
     */
    removeProject: function (name) {
      if (!_.isString(name)) {
        return false;
      }

      var p = this.getProject(name);

      if (_.isUndefined(p)) {
        return false;
      }

      var oldCount = this.projects().length;
      this.projects.remove(p);

      return this.projects().length === oldCount - 1;
    },

    /**
     * Initializes the application loading project configuration files
     * and instantiating associated data models
     * @returns {Object} RSVP.Promise
     */
    initialize: function () {
      var vm = this;

      return new RSVP.Promise(function (resolve, reject) {
        vm.getState().then(function (files) {
          // load the different configuration files
          files = files.filter(function (path) {
            return !_.isEmpty(path);
          });
          var directories = files.filter(function (path) {
            return strings.endsWith(path, '/');
          });
          var jsonFiles = files.filter(function (path) {
            return strings.endsWith(path, '.json');
          });
          var settingsFiles = jsonFiles.filter(function (path) {
            var name = path.replace(/^.*(\\|\/|\:)/, '');

            if (strings.startsWith(name, 'settings')) {
              return path;
            }
          });
          //win.log('app/initialize', 'walking through configuration directory', files);
          //win.log('app/initialize', 'directories', directories);
          //win.log('app/initialize', 'JSON files', jsonFiles);
          //win.log('app/initialize', 'settings files', settingsFiles);

          if (!settings.devMode && (_.isEmpty(jsonFiles) || _.isEmpty(directories) || _.isEmpty(settingsFiles))) {
            reject(new Error('An administrator must create a project before you can use the application'));
            return;
          }

          // read each configuration file
          var readSettings = settingsFiles.map(function (name) {
            return json.read(settings.configDirectoryPath + '/' + name);
          });

          // when all the settings files are read
          // we loop through the results to add projects or to populate errorReasons
          var errorReasons = [];

          RSVP.allSettled(readSettings).then(function (res) {
            res.forEach(function (promise) {
              if (promise.state === 'fulfilled') {
                vm.addProject(promise.value)
              } else if (promise.state === 'rejected') {
                errorReasons.push(promise.reason);
              }
            });
          });

          RSVP.all(readSettings).then(function () {
            resolve();
          }, function () {
            reject(errorReasons);
          });
        }, function (err) {
          reject(err);
        }).catch(function (err) {
          reject(err);
        });
      });
    },

    /**
     * Walks through the configuration directory
     * @returns {Object} RSVP.Promise
     */
    getState: function () {
      return requireNode('walk-tree-as-promised')(settings.configDirectoryPath);
    }
  };

  State.currentProject.subscribe(function (project) {
    win.log('state/currentProject/' + project.name);
  });

  return State;
});
