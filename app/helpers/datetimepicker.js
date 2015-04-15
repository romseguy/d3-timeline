define(['settings', 'bootstrap-datepicker'], function (settings) {
  return {

    activate: function (activationData) {
      this.startDate = activationData.startDate;
      this.endDate = activationData.endDate;
      this.minDate = activationData.minDate;
      this.maxDate = activationData.maxDate;
      this.dateFormat = settings.appConfiguration.dateFormat;

      ko.bindingHandlers.datetimepicker = {
        options: {
          format: settings.appConfiguration.dateFormat,
          language: 'en', // window.UserLanguage.substr(0, 2),
          pickTime: false,
          useCurrent: false // when true, picker will set the value to the current date/time (respects picker's format)
        },

        /**
         * This method is called once i.e when the bound input is composed
         * @param {DOMElement} element
         * @param valueAccessor
         * @param allBindingsAccessor
         */
        init: function (element, valueAccessor, allBindingsAccessor) {
          var $el = $(element);
          var options = ko.bindingHandlers.datetimepicker.options;
          var newOptions = allBindingsAccessor().dateTimePickerOptions;

          ko.utils.extend(options, newOptions);

          ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            // This will be called when the element is removed by Knockout or
            // if some other part of your code calls ko.removeNode(element)
            $el.data('DateTimePicker').destroy();
          });

          $el.datetimepicker(options).on('dp.change', function (evntObj) {
            // when we select a new date in the date picker, the associated input value (observable) is updated
            if (!_.isUndefined(evntObj.timeStamp)) {
              var observable = valueAccessor();
              var picker = $(this).data('DateTimePicker');
              observable(picker.getDate().format(picker.format));
              //win.log('forms/timeline/datetimepicker/dp.change', observable());
            }
          });

          $el.datetimepicker(options).on('dp.show', function (evntObj) {
            if ($el.attr('id') === 'startPicker') {
              var endPicker = $('#endPicker').data('DateTimePicker');

              if (endPicker.widget.is(':visible')) {
                endPicker.hide();
              }
            } else {
              var startPicker = $('#startPicker').data('DateTimePicker');

              if (startPicker.widget.is(':visible')) {
                startPicker.hide();
              }
            }
          });
        },

        /**
         * This method is called when one of the bound input's options or value change
         * @param element
         * @param valueAccessor
         * @param {Function} allBindingsAccessor
         * @param {Object} allBindingsAccessor.dateTimePickerOptions
         */
        update: function (element, valueAccessor, allBindingsAccessor) {
          var picker = $(element).data('DateTimePicker');
          var pickerId = $(element)[0].id;

          var newMoment = moment(uw(valueAccessor()), picker.format, true);
          var minMoment = moment(allBindingsAccessor().dateTimePickerOptions.minDate, picker.format, true);
          var maxMoment = moment(allBindingsAccessor().dateTimePickerOptions.maxDate, picker.format, true);

          if (newMoment.isValid() && newMoment.within(moment().range(minMoment, maxMoment))) {
            var previousMoment = picker.getDate();

            if (_.isNull(previousMoment) || !previousMoment.isSame(newMoment)) {
              win.log('forms/timeline/datetimepicker/update/date', newMoment.format(picker.format), pickerId);
              picker.setDate(newMoment);
            }
          }

          if (minMoment.isValid() && !picker.options.minDate.isSame(minMoment)) {
            win.log('forms/timeline/datetimepicker/update/minDate', minMoment.format(picker.format), pickerId);
            picker.setMinDate(minMoment);
          }

          if (maxMoment.isValid() && !picker.options.maxDate.isSame(maxMoment)) {
            win.log('forms/timeline/datetimepicker/update/maxDate', maxMoment.format(picker.format), pickerId);
            picker.setMaxDate(maxMoment);
          }
        }
      }
    }
  };

});