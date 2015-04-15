define(['settings', 'helpers/objects', 'models/entry'], function (settings, objects, Entry) {

  /**
   * @class ExcelBindings
   */
  var ExcelBindings = {
    /**
     * @param {ExcelSource} excelSource
     * @param {DataSourceGroup|DataSourceGroupForm} [dataSourceGroup]
     */
    constructor: function (excelSource, dataSourceGroup) {
      this.excelSource = excelSource;
      this.dataSourceGroup = dataSourceGroup;

      if (this.dataSourceGroup) {
        this.dataColumns = this.dataSourceGroup.dataColumnForms ? this.dataSourceGroup.dataColumnForms()
          : this.dataSourceGroup.dataColumns;
      }

      /**
       * @property {String}
       * The original or relative file path to the excel file
       */
      this.filePath = fs.existsSync(excelSource.originalFilePath) ? excelSource.originalFilePath
        : excelSource.filePath;

      /**
       * @property {Object[]}
       * Excel file parsed column headers
       */
      this.fileHeaders = [];

      /**
       * @property {Object}
       * Excel file parsed raw data
       */
      this.data = [];
    },

    /**
     * Loads excel source's parsed raw data into models
     * @returns {RSVP.Promise}
     * dataSource error is assigned to vm.excelSource.err
     * - rejects other errors
     * - resolves excel source
     */
    loadDataSource: function () {
      var vm = this;

      return new RSVP.Promise(function (resolve, reject) {
        if (!vm.dataSourceGroup) {
          reject(new Error('System error: could not load data source'));
        }

        var debug = vm.dataSourceGroup.name + '/backend/excel/loadDataSource/' + vm.excelSource.name;
        var dataClass, dataObject;

        win.log(debug);
        vm.excelSource.loadedFilePath = vm.filePath;

        switch (vm.excelSource.worksheet) {
          case 'Entries':
            dataClass = Entry;
            break;
          default:
            reject(new Error(vm.excelSource.worksheet + ' is not a supported worksheet'));
            return;
        }

        vm.parse().then(function () {
          win.log(debug + '/parsed');
          vm.excelSource.modified = moment(vm.excelSource.modified).format(settings.appConfiguration.dateFormat + ' H:m:s');

          // make sure all the data columns are found in the parsed file
          try {
            var checkedHeaders = vm.checkFormat();
            win.log(debug + '/checked', checkedHeaders);
          } catch (err) {
            vm.excelSource.err = err;
          }

          var notFoundHeaders = _.filter(checkedHeaders, { found: false });

          if (!_.isEmpty(notFoundHeaders)) {
            vm.excelSource.err = new Error('Required columns are missing: ' + notFoundHeaders.map(function (nfh) {
              return nfh.name;
            }).join());
          }

          // filters out the data that doesn't belong to the expected headers
          try {
            var filteredData = vm.filterData();
            win.log(debug + '/filtered', filteredData.length);
          } catch (err) {
            vm.excelSource.err = err;
          }

          // build models
          vm.excelSource.data = _.map(filteredData, function (row) {
            dataObject = new dataClass(row, vm.dataSourceGroup);
            return dataObject;
          });

          resolve (vm.excelSource);
        }, function (err) {
          vm.excelSource.err = err;
        });
      }).catch(function errorLoadingExcelSource (err) {
          win.error(err);
      });
    },

    /**
     * Parse the file
     * and store its file headers and data into their respective properties
     * @return {RSVP.Promise}
     */
    parse: function () {
      var vm = this;
      var debug = 'backend/excel/parse';
      var xlsx = requireNode('node-xlsx');
      var parsedFile;

      win.log(debug, vm.filePath);

      return new RSVP.Promise(function (resolve, reject) {
        try {
          parsedFile = xlsx.parse(vm.filePath);
        } catch (err) {
          win.log(debug, vm.filePath, err.message);
          reject(new Error('File: ' + vm.filePath + ' could not be read'));
        }

        var worksheet = _.find(parsedFile.worksheets, { 'name': vm.excelSource.worksheet });

        if (worksheet && !_.isEmpty(worksheet.data)) {
          vm.excelSource.fileHeaders = _.map(_.filter(worksheet.data[0], function (fileHeader) {
            return !_.isUndefined(fileHeader) && _.isString(fileHeader.value);
          }), function (fileHeader) {
            fileHeader.value = fileHeader.value.trim();
            return fileHeader;
          });

          vm.excelSource.rawData = _.filter(_.rest(worksheet.data, 1), function (line) {
            return !_.isUndefined(line);
          });

          vm.excelSource.modified = moment(parsedFile.modified).isValid() ? parsedFile.modified : null;
          resolve(vm.excelSource);
        } else if (_.isEmpty(worksheet.data)) {
          reject(new Error('Worksheet ' + vm.excelSource.worksheet + ' is empty'));
        } else {
          reject(new Error('Worksheet ' + vm.excelSource.worksheet + ' is missing'));
        }
      });
    },

    /**
     * Checks if the data columns match the file headers
     */
    checkFormat: function () {
      var vm = this;
      var debug = 'backend/excel/checkFormat';

      win.log(debug);

      if (_.isEmpty(vm.excelSource.fileHeaders)) {
        throw new Error('System error: could not check worksheet ' + vm.excelSource.worksheet + ' format');
      }

      return vm.dataColumns.map(function (dataColumn) {
        dataColumn.found = !_.isUndefined(_.find(vm.excelSource.fileHeaders, { value: uw(dataColumn.value) }));
        return dataColumn;
      });
    },

    /**
     * Selects the columns that are useful for the application (the default headers) from the raw data
     * and returns a collection of the resulting data instead of the parsed array of arrays
     * @return {Object[]}
     */
    filterData: function () {
      var vm = this;
      var debug = 'backend/excel/filterData';

      if (_.isEmpty(vm.dataColumns)) {
        throw new Error('System error: failed to filter worksheet ' + vm.excelSource.worksheet + ' data');
      }

      if (_.some(vm.dataColumns, function (dataColumn) {
        return _.isUndefined(dataColumn.index);
      })) {
        vm.indexDataColumns();
      }

      vm.excelSource.data = _.map(vm.excelSource.rawData, function (line) {
        return line.filter(function (col, columnIndex) {
          // filters out columns that are not matched by data columns
          var dataColumn = _.find(vm.dataColumns, { index: columnIndex });

          if (!_.isUndefined(dataColumn)) {
            // associate the column with the identifier used in the models
            col.nameVM = dataColumn.nameVM;
            return true;
          }

          return false;
        });
      });

      if (_.isEmpty(vm.excelSource.data)) {
        throw new Error('No relevant data found for worksheet ' + vm.excelSource.worksheet);
      }

      return objects.toCollection(vm.excelSource.data);
    },

    /**
     * Assign excel source's file headers indexes to the data columns
     * @returns {Object[]}
     */
    indexDataColumns: function () {
      var vm = this;

      return vm.dataColumns.map(function (dataColumn) {
        _.find(vm.excelSource.fileHeaders, function (fileHeader, index) {
          if (fileHeader.value === uw(dataColumn.value)) {
            dataColumn.index = index;
          }
        });

        return dataColumn;
      });
    }
  };

  return objects.defclass(ExcelBindings);
});