define([
  'durandal/app',
  'helpers/objects', 'helpers/strings'
], function (app, objects, strings) {
  /**
   * @class DataColumnForm
   */
  var DataColumnForm = {
    /**
     * @param settings
     * @param {Number} settings.id
     * @param {Number} settings.dataSourceGroupFormId
     * So we can send events to the right dataSourceGroupForm
     * @param {String} settings.name
     * The label of the data column displayed on the view
     * @param {String} [settings.nameVM]
     * The name used internally throughout the app
     * @param {String} [settings.value]
     * The column name as defined by the user
     * @param {String} [settings.format]
     * @param {Boolean} [settings.disabled]
     */
    constructor: function (settings) {
      var vm = this;
      settings.value = settings.value || '';

      vm.id = settings.id || null;

      vm.dataSourceGroupFormId = settings.dataSourceGroupFormId;

      vm.name = ko.observable(settings.name).extend(strings.getValidatedString('A column title is required'));

      vm.nameVM = !_.isUndefined(settings.nameVM) ? settings.nameVM : vm.name;

      vm.value = ko.observable(settings.value).extend(strings.getValidatedString('A column name is required'));

      vm.format = !_.isEmpty(settings.format) ? ko.observable(settings.format).extend(strings.getValidatedString('A format is required', false)) : '';

      vm.disabled = ko.observable(settings.disabled || false);
    },

    compositionComplete: function () {
      var vm = this;
      vm.value.subscribe(vm.valueChanged, vm);

      if (_.isFunction(vm.format)) {
        vm.format.subscribe(vm.valueChanged, vm);
      }
    },

    valueChanged: function (newValue) {
      if (!_.isString(newValue) || _.isEmpty(newValue)) {
        return;
      }

      app.trigger(this.dataSourceGroupFormId + ':datacolumnform:changed');
    },

    disable: function (dataColumnForm) {
      dataColumnForm.disabled(!uw(dataColumnForm.disabled));
      app.trigger(this.dataSourceGroupFormId + ':datacolumnform:changed');
    }
  };

  return objects.defclass(DataColumnForm);
});
