define(['helpers/objects'], function (objects) {
  /**
   * @class DataColumn
   */
  var DataColumn = {
    /**
     * @param {Object} data
     * @param {String|Function} [data.name]
     * @param {String|Function} [data.nameVM]
     * @param {String|Function} [data.value]
     * @param {String|Function} [data.format]
     * @param {Boolean|Function} [data.disabled]
     */
    constructor: function (data) {
      //win.log('models/datacolumn/new/in', data);
      this.name = uw(data.name) || '';
      this.nameVM = uw(data.nameVM) || '';
      this.value = uw(data.value) || '';
      this.format = uw(data.format) || '';
      this.disabled = uw(data.disabled) || false;

      this.dataSourceGroupFormId = 0;
      //win.log('models/datacolumn/new/out', this);
    },

    toJson: function () {
      return {
        name: this.name,
        nameVM: this.nameVM,
        value: this.value,
        format: this.format,
        disabled: this.disabled
      };
    }
  };

  return objects.defclass(DataColumn);
});