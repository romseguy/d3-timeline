define(['helpers/objects', 'settings'], function (objects, settings) {
  /**
   * @class Entry
   */
  var Entry = {
    /**
     * @param {Object} data
     * @param {String} data.name
     * @param {String|Date} data.date
     * @param {Number} data.progress
     * @param {DataSourceGroup|DataSourceGroupForm} dataSourceGroup
     */
    constructor: function (data, dataSourceGroup) {
      var vm = this;

      _.forOwn(data, function (value, key) {
        switch (key) {
          // strings
          case 'id':
          case 'name':
            if (!_.isString(value)) {
              value = value.toString();
            }
            data[key] = value.trim();
            break;
          // numbers
          case 'progress':
            if (!_.isNumber(value)) {
              value = parseInt(value);
            }
            data[key] = value;
            break;
          // dates
          case 'date':
            if (_.isNull(value) || _.isNaN(value)) {
              data[key] = {
                value: '',
                raw: null,
                isValid: false
              };
              return;
            }

            var savedDate = value;

            if (_.isDate(value)) {
              if (!_.isFinite(value.valueOf())) {
                data[key] = {
                  value: '',
                  raw: null,
                  isValid: false
                };
                return;
              }

              value = moment(value);
            } else if (_.isString(value)) {
              // parse the date with the user format
              var dataColumns = !_.isUndefined(dataSourceGroup.dataColumnForms) ? dataSourceGroup.dataColumnForms()
                : dataSourceGroup.dataColumns;
              var dataColumn = _.find(dataColumns, { nameVM: 'date' });
              value = moment(value, uw(dataColumn.format).toUpperCase(), true);
            } else {
              data[key] = {
                value: savedDate,
                raw: null,
                isValid: false
              };
              return;
            }

            value = value.hour(0).minute(0).second(0).millisecond(0);
            var isValid = value.isValid();

            data[key] = {
              value: isValid ? value.format(settings.appConfiguration.dateFormat) : savedDate,
              raw: value.toDate(),
              isValid: isValid
            };

            break;
        }
      });

      /**
       * @property {String}
       */
      vm.id = data.id || '-1';

      /**
       * @property {String}
       */
      vm.name = data.name || '';

      /**
       * @property {Object}
       */
      vm.date = data.date || {
        value: '',
        raw: null,
        isValid: false
      };

      /**
       * @property {Number}
       */
      vm.progress = data.progress || 0;
    }
  };

  return objects.defclass(Entry);
});