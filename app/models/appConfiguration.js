define(['helpers/objects', 'backend/json', 'settings'], function (objects, json, settings) {
  /**
   * @class AppConfiguration
   */
  var AppConfiguration = {
    /**
     * @param {Object} data
     * @param {String} data.dateFormat
     * @param {String} data.adminPassword
     * @param {String} data.question
     * @param {String} data.answer
     */
    constructor: function (data) {
      /**
       * @property {String}
       */
      this.filePath = settings.appConfigurationPath;

      /**
       * @property {String}
       * The date format used to display dates within the application
       */
      this.dateFormat = data.dateFormat || 'YYYY-MM-DD';

      /**
       * @property {String}
       */
      this.adminPassword = data.adminPassword || '';

      /**
       * @property {String}
       */
      this.question = data.question || '';

      /**
       * @property {String}
       */
      this.answer = data.answer || '';
    },

    /**
     * Saves the current app configuration to file
     * @return {RSVP.Promise}
     */
    save: function () {
      return json.write(this.filePath, this.cloneForSave());
    },

    /**
     * Clones the current project
     * and remove the runtime properties we don't want to store on the file system
     * @return {Project} the cloned and cleaned up current project observable
     */
    cloneForSave: function () {
      var copy = _.cloneDeep(this);
      delete copy.filePath;

      return copy;
    },

    resetPassword: function () {
      this.adminPassword = '';
      this.question = '';
      this.answer = '';
    }
  };

  return objects.defclass(AppConfiguration);
});