define([
  'durandal/app',
  'backend/excel',
  'models/excelsource', 'models/form',
  'helpers/notifications',
  'helpers/objects'
], function (app, ExcelBindings, ExcelSource, Form, snot, objects) {

  /**
   * @class ExcelForm
   * @extends Form
   */
  var ExcelForm = {
    /**
     * @param {ExcelSource|Object} settings
     * @param {Number} settings.dataSourceGroupId
     * @param {String} settings.worksheet
     * @param {DataColumnForm[]} settings.dataColumnForms
     */
    constructor: function (settings) {
      var vm = this;
      Form.call(vm, settings.worksheet);

      vm.dataSourceGroupId = settings.dataSourceGroupId;
      vm.worksheet = settings.worksheet;
      vm.excelSource = null;

      vm.displayName = ko.computed(function () {
        switch (vm.worksheet) {
          case 'Entries':
            return 'Entries.xlsx';
        }
      });

      vm.filePath = ko.observable().extend({
        required: true
      });

      vm.filePath.subscribe(vm.parseFile.bind(vm));
      vm.isLoading = ko.observable(false);
      vm.canCheck = ko.observable(false);

      vm.validFile = ko.observable(false);
      vm.validFormat = ko.observable(false);
      vm.validationModel = ko.validatedObservable({
        filePath: vm.filePath
      });
    },

    /**
     * @param {String} newFilePath
     */
    parseFile: function (newFilePath) {
      var vm = this;
      var debug = 'forms/excel/parseFile';

      snot.closeAll();
      vm.validFormat(false);

      if (_.isEmpty(newFilePath)) {
        vm.validFile(false);
        return;
      }

      vm.excelSource = new ExcelSource({
        worksheet: vm.worksheet,
        originalFilePath: newFilePath
      });

      new ExcelBindings(vm.excelSource).parse().then(function (excelSource) {
        win.log(debug + '/parsed', excelSource.rawData.length, 'entries');
        vm.excelSource = excelSource;
        vm.validFile(true);
        vm.canCheck(true);
      }, function (err) {
        vm.validFile(false);
        vm.canCheck(false);
        vm.filePath.setError(err);
        snot.notify(err, { timeout: 5, type: 'error' });
      });
    },

    getDataSource: function () {
      return this.excelSource;
    }
  };

  return objects.extend(Form, ExcelForm);
});