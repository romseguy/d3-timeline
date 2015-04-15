define([
  'durandal/app',
  'backend/excel',
  'models/form', 'models/datasourcegroup', 'models/entry',
  'forms/excel', 'forms/datacolumn',
  'state', 'settings', 'helpers/notifications',
  'helpers/objects', 'helpers/strings', 'helpers/datasourcegroups'
], function (app, ExcelBindings, Form, DataSourceGroup, Entry, ExcelForm, DataColumnForm, state, settings, snot, objects, strings, dataSourceGroupsHelper) {

  /**
   * @class DataSourceGroupForm
   * @extends Form
   */
  var DataSourceGroupForm = {
    /**
     * @param {Object} [settings]
     * @param {Number} [settings.id]
     * @param {DataSourceGroup} [settings.dataSourceGroup]
     */
    constructor: function (settings) {
      var vm = this;
      Form.call(vm);

      settings = settings || {};

      /**
       * @property {Number}
       */
      vm.id = ko.observable(settings.id || 0);
      vm.id.subscribe(function (newId) {
        vm.refreshListeners();
        vm.dataSourceForms().forEach(function (dataSourceForm) {
          dataSourceForm.dataSourceGroupId = newId;
          dataSourceForm.refreshListeners();
        });
      });

      /**
       * @property {DataSourceGroup}
       */
      vm.dataSourceGroup = settings.dataSourceGroup || null;

      /**
       * @property {String}
       */
      vm.name = ko.observable();

      if (_.isNull(vm.dataSourceGroup)) {
        vm.name.extend(strings.getValidatedString('A data source name is required.'));
        vm.name.subscribe(function (newDsgName) {
          vm.name(newDsgName.trim());
        });
      }

      /**
       * @property {DataColumnForm[]}
       */
      vm.dataColumnForms = ko.observableArray();

      /**
       * @property {Form[]}
       */
      vm.dataSourceForms = ko.observableArray();

      vm.validationModel = ko.validatedObservable({
        name: vm.name
      });

      vm.refreshListeners();
    },

    compositionComplete: function () {
      snot.focus('name');
    },

    refreshListeners: function () {
      var vm = this;
      vm.dataColumnDisabled = app.on(vm.id() + ':datacolumnform:changed').then(vm.onDataColumnFormChanged, vm);
    },

    /**
     * @param {Boolean} [checkForms]
     * Whether to validate children forms
     * @param {Boolean} [notify]
     * @returns {Boolean}
     */
    isValid: function (checkForms, notify) {
      var vm = this;

      checkForms = checkForms || _.isUndefined(checkForms);
      notify = _.isUndefined(notify);

      if (checkForms) {
        return vm.parent.isValid.call(vm, notify) && vm.dataSourceForms().every(function (form) {
          return form.isValid(notify);
        });
      } else {
        return vm.parent.isValid.call(vm, notify);
      }
    },

    /**
     * @param {Object} settings
     * @param {String} settings.type
     *
     */
    init: function (settings) {
      //win.log('forms/datasourcegroup/init', settings);
      var vm = this;
      vm.type = settings.type;

      // add data columns from existing data source group
      if (!_.isNull(vm.dataSourceGroup)) {
        vm.name(vm.dataSourceGroup.name);

        vm.dataSourceGroup.dataColumns.forEach(function (dc) {
          vm.addDataColumnForm(dc);
        });
      }
      // add data columns
      else {
        vm.dataColumnForms([]);
        dataSourceGroupsHelper.getDataColumns().forEach(vm.addDataColumnForm.bind(vm));
      }

      vm.initForms();
    },

    initForms: function () {
      win.log('forms/datasourcegroup/initForms');

      var vm = this;
      var EntriesForm;
      var formSettings = {
        dataSourceGroupId: vm.id()
      };

      vm.dataSourceForms([]);

      // append the new forms
      if (vm.type === 'excel') {
        formSettings.worksheet = 'Entries';
        formSettings.dataColumnForms = vm.dataColumnForms();

        EntriesForm = new ExcelForm(formSettings);
        vm.dataSourceForms.unshift(EntriesForm);
      }
    },

    /**
     * @param {String} name
     * @return {Form|undefined}
     */
    getForm: function (name) {
      if (!_.isEmpty(name) && _.isString(name)) {
        return _.find(this.dataSourceForms(), { name: name });
      }

      return undefined;
    },

    /**
     * Adds a data column to the list
     * @param {Object} [settings]
     */
    addDataColumnForm: function (settings) {
      var vm = this;
      settings.dataSourceGroupFormId = vm.id();

      var dc = new DataColumnForm(settings);
      vm.dataColumnForms.push(dc);
    },

    /**
     * Checks the data columns configuration against the parsed file
     */
    check: function () {
      var vm = this;
      var debug = 'forms/datasourcegroup/check';
      var form = vm.getForm('Entries');

      form.validFormat(false);
      form.isLoading(true);

      if (!form.isValid()) {
        form.isLoading(false);
        return;
      }

      if (form instanceof ExcelForm) {
        var excelBindings = new ExcelBindings(form.excelSource, vm);
        var dataColumns;

        try {
          dataColumns = excelBindings.checkFormat();
          win.log(debug + '/dataColumns', dataColumns);
        } catch (err) {
          snot.notify(err, { type: 'error' });
          form.isLoading(false);
          return;
        }

        var missingDataColumns = _.filter(dataColumns, function (dataColumn) {
          return !dataColumn.found;
        });

        if (!_.isEmpty(missingDataColumns)) {
          snot.notify('Invalid worksheet ' + vm.form.worksheet + ' format. ' + missingDataColumns.length
          + ' columns are missing: ' + missingDataColumns.map(function (mdc) { return mdc.name(); }).join(),
            { type: 'error' });
          form.isLoading(false);
          return;
        }

        try {
          form.excelSource.data = excelBindings.filterData();
        } catch (err) {
          snot.notify(err, { type: 'error' });
          form.isLoading(false);
          return;
        }

        form.excelSource.data = form.excelSource.data.map(function (row) {
          return new Entry(row, vm);
        });

        form.validFormat(true);
        form.isLoading(false);
      }
    },

    /**
     * Opens the dialog for viewing loaded entries
     */
    showData: function () {
      var vm = this;
      var form = vm.getForm('Entries');

      if (_.isEmpty(form.excelSource.data)) {
        return;
      }

      form.isLoading(true);

      app.showDialog('dialogs/entries', {
        action: 'showAll',
        dataSourceGroup: vm,
        dataSource: form.excelSource
      }, 'app', {
        fixedHeader: true,
        keyboard: true
      }).then(function () {
        form.isLoading(false);
      });
    },

    onDataColumnFormChanged: function () {
      var vm = this;
      var debug = 'forms/datasourcegroup/onDataColumnFormChanged';
      var form = vm.getForm('Entries');

      win.log(debug);
      form.validFormat(false);
    }
  };

  return objects.extend(Form, DataSourceGroupForm);
});