define(['helpers/notifications', 'helpers/objects'], function (snot, objects) {
  /**
   * @class Form
   * @abstract
   */
  var Form = {
    /**
     * @param {String} [name]
     */
    constructor: function (name) {
      /**
       * @property {String}
       */
      this.name = name || '';

      /**
       * @property {Object}
       * @abstract
       * Knockout validated observable for form fields
       */
      this.validationModel = {};
    },

    /**
     * @param {Boolean} [notify]
     * True to display user notifications of form errors
     * @return {Boolean} whether or not the validation model is valid
     */
    isValid: function (notify) {
      var vm = this;

      notify = arguments.length > 0 ? notify : true;

      if (_.isEmpty(this.validationModel)) {
        _.forOwn(this, function (value, key) {
          if (ko.isObservable(value)) {
            vm.validationModel[key] = value;
          }
        })
      }

      if (!_.isFunction(this.validationModel)) {
        this.validationModel = ko.validatedObservable(this.validationModel);
      }

      if (!this.validationModel().isValid()) {
        this.validationModel.errors.showAllMessages();

        if (notify) {
          snot.notify(this.validationModel.errors(), {timeout: 5, type: 'error', position: 'top-center'});
        }

        return false;
      }

      return true;
    }
  };

  return objects.defclass(Form);
});