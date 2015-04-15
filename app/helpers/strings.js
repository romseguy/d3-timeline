define([], function () {
  return {
    startsWith: function (str, prefix) {
      return str.slice(0, prefix.length) == prefix;
    },

    endsWith: function (str, suffix) {
      return str.slice(-suffix.length) == suffix;
    },

    /**
     * @param {String} requiredMsg
     * @param {String|Boolean} [pattern='^[A-Za-z0-9_-\\s]+$']
     * @returns {Object}
     */
    getValidatedString: function (requiredMsg, pattern) {
      pattern = _.isUndefined(pattern) ? '^[A-Za-z0-9_-\\s]+$' : pattern;

      var validator = {
        minLength: 2
      };

      validator = Object.defineProperty(validator, 'required', {
        enumerable: true,
        value: {
          message: requiredMsg
        }
      });

      if (pattern) {
        validator = Object.defineProperty(validator, 'pattern', {
          enumerable: true,
          value: {
            message: 'Only alphanumeric characters are allowed',
            params: pattern
          }
        });
      }

      return validator;
    },

    /**
     * Computes ideal text color based on background color
     * @param {String} hex
     * Background color hex code
     * @returns {String}
     * Black or white
     */
    getIdealTextColor: function (hex) {
      var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      var r = parseInt(rgb[1], 16);
      var g = parseInt(rgb[2], 16);
      var b = parseInt(rgb[3], 16);

      var nThreshold = 105;
      var bgDelta = (r * 0.299) + (g * 0.587) + (b * 0.114);

      return ((255 - bgDelta) < nThreshold) ? '#000000' : '#ffffff';
    }
  };
});