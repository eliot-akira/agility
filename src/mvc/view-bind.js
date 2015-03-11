
/*---------------------------------------------
 *
 * View bindings
 *
 *  Apply DOM <-> Model bindings, from elements with 'data-bind' attributes
 *
 */

module.exports = function bindings() {

  var self = this; // Reference to object
  var $rootNode = this.view.$().filter('[data-bind]');
  var $childNodes = this.view.$('[data-bind]');

  var createAttributePairClosure = function(bindData, node, i) {
    var attrPair = bindData.attr[i]; // capture the attribute pair in closure
    return function() {

      if ( attrPair.attr == 'html' ) {
        // Allow inserting HTML content
        node.html(self.model.get(attrPair.attrVar));
      } else {
        // Normal element attributes
        node.attr(attrPair.attr, self.model.get(attrPair.attrVar));
      }
    };
  };

  $rootNode.add( $childNodes ).each( function() {

    var $node = $(this);
    var bindData = _parseBindStr( $node.data('bind') );
    var required = $node.data('required'); // data-required

    var bindAttributesOneWay = function() {
      // 1-way attribute binding
      if (bindData.attr) {
        for (var i = 0; i < bindData.attr.length; i++) {
          self.bind('_change:'+bindData.attr[i].attrVar,
            createAttributePairClosure(bindData, $node, i));
        } // for (bindData.attr)
      } // if (bindData.attr)
    }; // bindAttributesOneWay()
    

    if ( bindData.key ) {

      /*---------------------------------------------
       *
       * Input types
       *
       */

      // <input type="checkbox">: 2-way binding

      if ($node.is('input:checkbox')) {
        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          $node.prop("checked", self.model.get(bindData.key)); // this won't fire a DOM 'change' event, saving us from an infinite event loop (Model <--> DOM)
        });            
        // DOM --> Model
        $node.change(function(){
          var obj = {};
          obj[bindData.key] = $(this).prop("checked");
          self.model.set(obj); // not silent as user might be listening to change events
        });
      }
      
      // <select>: 2-way binding

      else if ($node.is('select')) {
        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          var nodeName = $node.attr('name');
          var modelValue = self.model.get(bindData.key);
          $node.val(modelValue);
        });            
        // DOM --> Model
        $node.change(function(){
          var obj = {};
          obj[bindData.key] = $node.val();
          self.model.set(obj); // not silent as user might be listening to change events
        });
      }
      
      // <input type="radio">: 2-way binding

      else if ($node.is('input:radio')) {

        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          var nodeName = $node.attr('name');
          var modelValue = self.model.get(bindData.key);

            // $node.siblings('input[name="'+nodeName+'"]').filter('[value="'+modelValue+'"]').prop("checked", true);

            // @pull #110 Binding for radio buttons
            // They're not always siblings, so start from $root
            self.view.$root.find('input[name="'+nodeName+'"]')
              .filter('[value="'+modelValue+'"]')
              .prop("checked", true);
              // this won't fire a DOM 'change' event, saving us from
              // an infinite event loop (Model <--> DOM)
        });            

        // DOM --> Model

        $node.change(function(){
          if (!$node.prop("checked")) return; // only handles check=true events
          var obj = {};
          obj[bindData.key] = $node.val();
          self.model.set(obj); // not silent as user might be listening to change events
        });
      }
      
      // <input type="search"> (model is updated after every keypress event)

      else if ($node.is('input[type="search"]')) {

        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          // this won't fire a DOM 'change' event, saving us from
          // an infinite event loop (Model <--> DOM)
          $node.val(self.model.get(bindData.key));
        });

        // Model <-- DOM
        $node.keypress(function(){
          // Without timeout $node.val() misses the last entered character
          setTimeout(function(){
            var obj = {};
            obj[bindData.key] = $node.val();
            self.model.set(obj); // not silent as user might be listening to change events
          }, 50);
        });
      }

      // <input type="text">, <input>, and <textarea>: 2-way binding

      else if ($node.is('input:text, input[type!="search"], textarea')) {
        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          // this won't fire a DOM 'change' event, saving us from
          // an infinite event loop (Model <--> DOM)
          $node.val(self.model.get(bindData.key));
        });            
        // Model <-- DOM
        $node.change(function(){
          var obj = {};
          obj[bindData.key] = $(this).val();
          self.model.set(obj); // not silent as user might be listening to change events
        });
      }
      
      // all other <tag>s: only Model -> DOM text

      else {
        self.bind('_change:'+bindData.key, function(){
          var key = self.model.get(bindData.key);
          if (key || key===0) {
            $node.text(self.model.get(bindData.key).toString());
          } else {
            $node.text('');
          }
        });
      }
    }

    // Model -> DOM attributes
    bindAttributesOneWay();

    // Custom bindings
    bindData.attr.forEach(function(pair, index){
      // Keyup
      if ( pair.attr === 'keyup' ) {
        $node.keyup(function(){
          // timeout to make sure to get last entered character
          setTimeout(function(){
            self.model.set( pair.attrVar, $node.val() ); // fires event
          }, 50);
        });        
        self.bind('_change:'+pair.attrVar, function(){
          $node.val( self.model.get( pair.attrVar ) );
        });

      // Visible
      } else if ( pair.attr === 'visible' ) {

      } 
    });

    // Store binding map for later reference
    self.$node[ bindData.key ] = $node; // Model property -> element
    self.key[ $node ] = bindData.key; // Element -> Model property

    if ( typeof required !== 'undefined' ) {
      self.required[ bindData.key ] = required;
    }

  }); // nodes.each()

  return this;

}; // bindings()



/*---------------------------------------------
 *
 * Parse data-bind string
 * 
 * Syntax:'[attribute][=] variable[, [attribute][=] variable ]...'
 * 
 * All pairs in the list are assumed to be attributes
 * If the variable is not an attribute, it must occur by itself
 *
 * Returns { key:'model key', attr: [ {attr : 'attribute', attrVar : 'variable' }... ] }
 *
 */

function _parseBindStr( str ) {
  var obj = {key:null, attr:[]},
      pairs = str.split(','),
      // regex = /([a-zA-Z0-9_\-]+)(?:[\s=]+([a-zA-Z0-9_\-]+))?/,
      // @pull #91 Add support for nested models: key.prop
      regex = /([a-zA-Z0-9_\-\.]+)(?:[\s=]+([a-zA-Z0-9_\-]+))?/,
      keyAssigned = false,
      matched;
  
  if (pairs.length > 0) {
    for (var i = 0; i < pairs.length; i++) {
      matched = pairs[i].match(regex);
      // [ "attribute variable", "attribute", "variable" ]
      // or [ "attribute=variable", "attribute", "variable" ]
      // or
      // [ "variable", "variable", undefined ]
      // in some IE it will be [ "variable", "variable", "" ]
      // or
      // null
      if (matched) {
        if (typeof(matched[2]) === "undefined" || matched[2] === "") {
          if (keyAssigned) {
            throw new Error("You may specify only one key (" + 
              keyAssigned + " has already been specified in data-bind=" + 
              str + ")");
          } else {
            keyAssigned = matched[1];
            obj.key = matched[1];
          }
        } else {
          obj.attr.push({attr: matched[1], attrVar: matched[2]});
        }
      } // if (matched)
    } // for (pairs.length)
  } // if (pairs.length > 0)
  
  return obj;
}
