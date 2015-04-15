define([], function () {
  return {
    defclass: function (prototype) {
      var constructor = prototype.constructor;
      var instance = function () {
      };

      prototype.instance = instance;
      constructor.prototype = prototype;
      instance.prototype = constructor.prototype;

      return constructor;
    },

    extend: function (parent, keys) {
      var supertype = parent.prototype;
      keys.parent = supertype;

      var prototype = new supertype.instance;

      for (var key in keys)
        prototype[key] = keys[key];

      return this.defclass(prototype);
    },

    /**
     * @param {Array[]} data
     * [
     *    [ // line
     *      { value: '01010', nameVM: 'id' }, // col
     *    ],
     * ]
     * @returns {Object[]}
     * [
     *    { id: 01010 },
     * ]
     */
    toCollection: function (data) {
      return _.map(data, function (line) {
        var map = {};

        for (var i = 0; i < line.length; i++) {
          var col = line[i];
          map[col.nameVM] = col.value;
        }

        return map;
      });
    },

    clearAttributes: function (el) {
      for (var i = el.attributes.length - 1; i >= 0; i--) {
        el.removeAttributeNode(el.attributes[i]);
      }
    }
  }
});