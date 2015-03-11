
/*---------------------------------------------
 *
 * Form helpers
 *
 */

var $ = require('jquery');

module.exports = {

  form : {

    // Clear the form
    clear : function() {

      return this.$view.find(':input, textarea')
        .not(':button, :submit, :reset, :hidden').removeAttr('checked').removeAttr('selected')
        .not(':checkbox, :radio, select').val('');
    },

    // Validate model, instead of form in the DOM directly
    // @return An array of invalid model properties
    invalid : function() {

      return this.model.invalid();
    }
  }

};

