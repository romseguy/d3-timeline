define([
  'models/color', 'models/form',
  'state', 'settings',
  'helpers/objects', 'helpers/strings', 'helpers/datasourcegroups'
], function (Color, Form, state, settings, objects, strings, dataSourceGroupsHelper) {
  /**
   * @class TimelineForm
   * @extends Form
   */
  var TimelineForm = {
    /**
     * @param {Timeline} [timelineCfg]
     * Supplied only if we want to update an existing Timeline configuration
     */
    constructor: function (timelineCfg) {
      var vm = this;
      Form.call(vm);

      /**
       * @property {String}
       */
      vm.dateFormat = settings.appConfiguration.dateFormat;

      /**
       * @property {String}
       */
      vm.displayName = timelineCfg ? 'Update Timeline Configuration' : 'New Timeline Configuration';

      /**
       * @property {String}
       * Observes the chart name
       */
      vm.chartName = ko.observable(timelineCfg ? timelineCfg.name : '').extend(strings.getValidatedString('A chart name is required.'));
      vm.chartName.subscribe(function (newValue) {
        vm.chartName(newValue.trim());
      });

      /**
       * @property {DataSourceGroup[]}
       */
      vm.dataSourceGroups = ko.observableArray(state.currentProject().dataSourceGroups.filter(function (dataSourceGroup) {
        return !dataSourceGroup.hasError();
      }));

      /**
       * @property {DataSourceGroup[]}
       * Observes data sources selection
       */
      vm.selectedDataSourceGroups = ko.observableArray(timelineCfg ? state.currentProject().getDataSourceGroup(timelineCfg.dataSourceGroupNames) : [vm.dataSourceGroups()[0]]).extend({
        required: { message: 'Select at least one data source.' }
      });

      /**
       * @event
       */
      vm.selectedDataSourceGroups.subscribe(function () {
        vm.selectedDateField('');
      });

      /**
       * @property {String} minDate
       * @property {String} maxDate
       */
      vm.minDate = ko.observable(timelineCfg ? timelineCfg.startDate : '');
      vm.maxDate = ko.observable(timelineCfg ? timelineCfg.endDate : '');

      /**
       * @property {String} startDate
       * @property {String} endDate
       * Observes the start/end dates the user chooses
       */
      vm.startDate = ko.observable(timelineCfg ? timelineCfg.startDate : '').extend({
        minLength: 10,
        maxLength: 10,
        simpleDate: {
          minDate: vm.minDate,
          maxDate: vm.maxDate
        },
        required: { message: 'A start date is required.' }
      });
      vm.endDate = ko.observable(timelineCfg ? timelineCfg.endDate : '').extend({
        minLength: 10,
        maxLength: 10,
        simpleDate: {
          minDate: vm.minDate,
          maxDate: vm.maxDate
        },
        isAfterDate: vm.startDate,
        required: { message: 'An end date is required.' }
      });

      /**
       * @property {String}
       * Observes the selected date field the Timeline will be ordered against
       */
      vm.selectedDateField = ko.observable(timelineCfg ? dataSourceGroupsHelper.getViewName(timelineCfg.orderedBy[0]) : '').extend({
        required: { message: 'A chart type is required.' }
      });
      /**
       * @event
       */
      vm.selectedDateField.subscribe(function (newDateField) {
        if (_.isEmpty(newDateField)) {
          return;
        }
        refreshDatePickers(newDateField);
      });

      if (timelineCfg) {
        vm.oldName = timelineCfg.name;

        var minmax = dataSourceGroupsHelper.getMinMaxDates(vm.selectedDataSourceGroups(), dataSourceGroupsHelper.getViewName(timelineCfg.orderedBy[0]));
        vm.minDate(minmax.min.format(vm.dateFormat));
        vm.maxDate(minmax.max.format(vm.dateFormat));

        vm.startDate.isModified(true);
        vm.endDate.isModified(true);
      }

      /**
       * @property {String[]} dateFields
       * The select date fields options
       */
      vm.dateFields = ['Date'];

      /**
       * @property {Color[]}
       */
      vm.colors = ko.observableArray(timelineCfg ? timelineCfg.colors : settings.defaultColors);
      vm.colors(vm.colors().map(function (color, index) {
        return new ColorVM(index, color);
      }));

      /**
       * @property {Number}
       */
      vm.weeksPadding = timelineCfg ? timelineCfg.weeksPadding : 0;

      /**
       * @property {Number}
       */
      vm.minimumDuration = ko.observable(timelineCfg ? timelineCfg.minimumDuration : 8);

      vm.durationBetweenStartEndDates = ko.computed(function () {
        var weeks = moment().range(moment(vm.startDate(), settings.appConfiguration.dateFormat), moment(vm.endDate(), settings.appConfiguration.dateFormat)).diff('weeks');
        if (weeks <= 0) {
          return new Array(10);
        }
        if (weeks < vm.minimumDuration()) {
          vm.minimumDuration(weeks);
        }
        return new Array(weeks);
      });

      vm.validationModel = ko.validatedObservable({
        selectedDataSourceGroups: vm.selectedDataSourceGroups,
        chartName: vm.chartName,
        selectedDateField: vm.selectedDateField,
        startDate: vm.startDate,
        endDate: vm.endDate
      });

      /**
       * @private
       * @param newDateField
       */
      function refreshDatePickers(newDateField) {
        if (_.isEmpty(newDateField)) {
          return;
        }

        var minmax = dataSourceGroupsHelper.getMinMaxDates(vm.selectedDataSourceGroups(), newDateField);
        var min = minmax.min;
        var max = minmax.max;
        vm.startDate(min.format(vm.dateFormat));
        vm.endDate(max.format(vm.dateFormat));
        vm.minDate(min.format(vm.dateFormat));
        vm.maxDate(max.format(vm.dateFormat));
      }

      /**
       * @private
       * @class ColorVM
       * @param {Color} color
       */
      function ColorVM(index, color) {
        var cvm = this;
        this.index = index;
        this.name = color.name;
        this.start = ko.observable(color.start);
        this.end = ko.observable(color.end);
        this.hex = ko.observable(color.hex);

        this.end.subscribe(function (newValue) {
          for (var i = 0; i < vm.colors().length; i++) {
            var color = vm.colors()[i];

            // update the preceding color
            if (color.index === cvm.index - 1) {
              color.start(newValue);

              if (color.end() <= newValue) {
                color.end(parseInt(newValue) + 1);
              }

              return;
            }
          }
        });
      }
    }
  };

  ko.validation.rules['simpleDate'] = {
    validator: function (val, options) {
      var newMoment = moment(val, settings.appConfiguration.dateFormat, true);
      var minMoment = moment(ko.validation.utils.getValue(options.minDate), settings.appConfiguration.dateFormat);
      var maxMoment = moment(ko.validation.utils.getValue(options.maxDate), settings.appConfiguration.dateFormat);

      return ko.validation.utils.isEmptyVal(val) || (newMoment.within(moment().range(minMoment, maxMoment)) && newMoment.isValid());
    },
    message: 'Please enter a proper date'
  };

  ko.validation.rules['isAfterDate'] = {
    validator: function (date, otherDate) {
      var m1 = moment(date, settings.appConfiguration.dateFormat);
      var m2 = moment(ko.validation.utils.getValue(otherDate), settings.appConfiguration.dateFormat);
      return m1.isAfter(m2) || m1.isSame(m2);
    },
    message: 'The end date cannot be before the start date'
  };

  return objects.extend(Form, TimelineForm);
});