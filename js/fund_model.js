/*
 * jQuery Tiny Pub/Sub
 * https://github.com/cowboy/jquery-tiny-pubsub
 *
 * Copyright (c) 2013 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

(function($) {

  var o = $({});

  $.subscribe = function() {
    o.on.apply(o, arguments);
  };

  $.unsubscribe = function() {
    o.off.apply(o, arguments);
  };

  $.publish = function() {
    o.trigger.apply(o, arguments);
  };

}(jQuery));


var fundModel = (function () {

  // funds is a map of Fund instances
  // myFunds is just a map for convenience
  var
    funds = {}
  , myFunds = {}

  function Fund(info) {
    // default goes here
    // then override:
    $.extend(this, info);
  }
  Fund.prototype = {
      constructor: Fund,
      getYield: function() {
          return this.share * this.dailyRate
      }
  };


  //----- METHODS ------
  function add(raw) {
    if($.isArray(raw)) {
      $.each(raw, function (i, obj) {
        _add(obj);
      })
    } else _add(raw);
  }
  function _add(fund) {
    var code = fund.code;
    if(code) {
      return funds[code] = funds[code] || new Fund(fund);
    }
  }

  // currently we can only get my fund from hash-map: `funds`
  // otherwise we fail
  /**
   *
   * @param my string|Fund instance, in most cases it is a Fund instance (since we want to pass
   *        at least a share property)
   */
  function addToMy(my) {
    var fund;
    if(typeof my === 'string' || my instanceof Fund){

      fund = _addToMy(my);
      // TODO: this has poor performance, figure out some better way to boost it:
      store('my', myFunds);
      $.publish('fundadded', [fund]);
      // unemptied -- weird word...
      if(_keysCount(myFunds) === 1) $.publish('fundunemptied');
    }


  }


  function _addToMy(my, fromStore) {
    var fund;
    // whatever, fund would be an instance of Fund:
    fund = fromStore ? _add(my) : get(my);
    // there is no `000000` as a code...
    if(!fund || !fund.code || myFunds[fund.code]) return;
    if(my.share) $.extend(fund, my);
    fund.my = true;
    myFunds[fund.code] = fund;
    return fund;
  }



  function update(fund) {
    get(fund).share = fund.share;
    store('my', myFunds);
    $.publish('fundupdated', [fund]);
  }

  function remove(code) {
    removeMy(code);
    delete funds[code];
  };

  function removeMy(code) {
    if(!myFunds[code]) return;

    delete myFunds[code];
    get(code).my = false;
    store('my', myFunds);

    $.publish('fundremoved', [code]);

    console.log(_keysCount(myFunds));
    if(_keysCount(myFunds) === 0) {
      $.publish('fundemptied');
    }

  }
  function getYield() {
      var total = 0;
      $.each(myFunds, function(i, fund) {
          total += fund.getYield();
      });
      return total;
  };

  /**
   * @param code We may pass in a `code` string, as well as an object who has a code property
   * @returns {*}
   */
  function get(code) {

    if(typeof code === 'object') code = code.code;
    if(code) return funds[code];

  };

  function _keysCount(obj) {
    // Object.keys -- only IE9+
    var count = 0;
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        ++count;
      }
    }
    return count;
  }

  function isMyEmpty() {
    return $.isEmptyObject(myFunds);
  }

  // a little mess here:
  function _initMy() {
    var myFunds = store('my');
    if(myFunds) {
      $.each(myFunds, function (code, fund) {
        _addToMy(fund, true);
      })
    }
    console.log('in _initMY');

    if(_keysCount(myFunds) === 0) $.publish('fundvirgin');
  }
  function init() {
    _initMy();
  }



  return {
    get: get,
    add: add,
    update:  update,
    remove: remove,
    addToMy: addToMy,
    removeMy: removeMy,
    getYield: getYield,
    funds: funds,
    myFunds: myFunds,
    init: init,
    isMyEmpty: isMyEmpty
  };
})();