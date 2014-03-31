$(function () {

  //----- DOM CACHE ------
  var $yieldPanel = $('#yield')
    , $yieldTab = $('a[href=#' + $yieldPanel.attr('id') + ']')
    , $tmpTab = $('a[href=#' + 'tmp' + ']')

  var cMy, cDoc, cCommon, cSearch
  var fm = fundModel;
  var virgin = false;
  cCommon = (function () {
    var $common;

    function init() {
      $common = $('ul', '#common-funds');
      _buildDom();
      _bind();
      _subscribe();
    }


    function _bind() {
      $common.on('click', 'button', function () {
        cDoc.add($(this).closest('li').data('code'));
      });
    }


    function _subscribe() {
      $.subscribe('fundadded', function (e, fund) {
        _getLi(fund.code)
          .find('button')
            .prop('disabled', true)
            .text('已添加')
      });
      $.subscribe('fundremoved', function (e, code) {
        _getLi(code)
          .find('button')
            .prop('disabled', false)
            .text('添加')

      });
    }

    function _getLi(code) {
      return $common.children().filter(function () {
        return $(this).data('code') === code;
      });
    }

    function _buildDom() {
      $common.replaceWith(buildUl(fm.funds));
      $common = $('ul', "#common-funds");
    }

    return {
      init: init
    }
  })();

  cMy = (function(){

    var $my
      , $th
      , $btnCheckYield
    // TODO: add localStorage support


    function init() {
      $my = $('tbody', '#my-funds');
      $th = $('thead', "#my-funds");
      $btnCheckYield = $('.checkYield', '#my-funds');
      _init();
      _bind();
      _subscribe();
    }

    function _init() {
      // TODO: or should I just skip initialization and leave all to events??
      var myFunds = fm.myFunds;
      if(!$.isEmptyObject(myFunds)) {
        $.each(myFunds, function (code, fund) {
          add(null, fund);
        });
      }
    }


    function _bind() {

      $my
        .on('click', '.edit', function () {
          cDoc.update($(this).closest('tr').data('code'));
        })
        .on('click', '.delete', function () {
          var sure = confirm('确定删除么')
          sure && fundModel.removeMy($(this).closest('tr').data('code'));
        });

      $btnCheckYield.on('click', function () {
        $yieldTab.tab('show');
      });
    }

    function _subscribe() {
      $.subscribe('fundadded', add)
      $.subscribe('fundupdated', update)
      $.subscribe('fundremoved', remove)


      $.subscribe('fundemptied', _hide);
      $.subscribe('fundunemptied', _show);

    }

    function add( e, fund ) {

      $my.append(_generateTr(fund));

    }

    function update( e, fund) {
      _getTr(fund.code).find('.share').text(fund.share);

    }

    function _hide() {
      $btnCheckYield.add($th).hide();

    }
    function _show() {
      $btnCheckYield.add($th).show();
    }


    function remove(e, code) {

      var $tr = _getTr(code);
      if($tr) $tr.remove();
    }

    function _getTr(code) {
      return $my.find('tr').filter(function () {
        return $(this).data('code') === code;
      });
    }

    function _generateTr(fund) {
      //TODO: use docFragment and cache??
      return $('<tr/>')
        .append(
          $('<td/>', {"class":"img-container"}).append(
            $('<img/>',{src:fund.img, "class":"img-responsive"})
          )
        )
        .append($('<td/>',{text:fund.name}))
        .append($('<td/>',{text:fund.share, "class": 'share'}))
        .append(
          '<td class="btn-toolbar" role="toolbar">' +
            '<div class="btn-group">' +
            '<button type="button" class="edit btn btn-default btn-sm">' +
            '<span class="glyphicon glyphicon-pencil"></span>' +
            '</button>' +

            '<button type="button" class="delete btn btn-default btn-sm">' +
            '<span class="glyphicon glyphicon-trash"></span>' +
            '</button>' +
            '</div>' +
            '</td>'
        )
        .data('code', fund.code)
    }



    return {
      init: init,
    }

  })();

  // cDoc <- controller of document
  cDoc = (function(){
    // TODO: consider not cache so many dom:
    var $modal
      , $input
      , $name
      , $img
      , $save;

    // two closure variables:
    var operation
      , fund;

    function init() {
      $modal = $("#input-modal")
      $save = $('.save', $modal);
      _initModal();
      _bind();
    }

    function add(code) {
      fund = fm.get(code);
      if(fund){
        operation = 'save';
        _changeModal(fund, {title: '添加至我的基金'});
        $modal.modal('show');
      }
    }

    function update(code) {
      fund = fm.get(code);
      if(fund){
        operation = 'update';
        _changeModal(fund, {title: '修改份数'});
        $modal.modal('show');
      }
    }



    function _bind() {
      $save.on('click', function () {
        var fn = operation == 'save' ? fm.addToMy : fm.update;
        fund.share = parseInt($input.val(), 10) || 0;
        fn.call(fm, fund);
        $modal.modal('hide');
      });

      $modal
        .on('shown.bs.modal', function () {
          $input.focus().select();
        })
        .on('keypress', function (e) {
          if(e.which === 13) {
            $save.trigger('click');
          }
        });
    }

    function _initModal() {
      $input = $('<input/>', {type: 'text'});
      var $container = $('<div/>', {"class": "text-center"})
        .append(
          $('<div/>', {"class": "img-container"})
            .append($img = $('<img/>', {"class": "img-responsive"}))
        )
        .append($name = $('<span/>', {"class": "name"}))
        .append($input);
      $('.modal-body', $modal).html($container);
      $input.spinner({
        step: 1,
        numberFormat: "n",
        min: 0
      });
    }


    function _changeModal( fund, options) {
      if(options.title) $modal.find('.modal-title').text(options.title);
      $name.text(fund.name);
      $input.val(fund.share || 0);
      $img.attr('src', fund.img);
    }



    return {
      add: add,
      update: update,
      init: init
    }
  })();


  var cYield = (function(){
    var $yieldResult;
    var animation = true;

    function init(anim) {
      $yieldResult = $('#yield-result');
      if(anim !== undefined) animation = anim;
      if(!virgin) showYield();
      _bind();
      _subscribe();
    }

    function _bind() {
      $yieldTab.on('shown.bs.tab', function () {
        console.log('in shown.bs.tab event');
        showYield();
      });

    }

    function _subscribe() {
      $.subscribe('fundemptied', function () {

        $yieldTab.parent('li').prop('disabled',true);
        $yieldTab.on('click.fund', function () {
          return false;
        });
      });

      $.subscribe('fundunemptied', function () {
        $yieldTab.parent('li').prop('disabled', false);
        $yieldTab.off('click.fund');
      });

    }

    function _makeSlots(num) {
      num = parseFloat(num).toFixed(2);
      var arr
      // if false, throw
      arr = num.split('');

      return $.map(arr, function (n, i) {
        return $('<div/>', {"class": n === '.' ? 'dot' : "slot", text: n });
      });

    }

    function _makeTeeth(arr) {
      var level = arr.length - 1;
      return $.map( arr, function ($slot, i) {

        var num = parseInt($slot.text(), 10);

        if(isNaN(num)) return $slot;

        return $slot.empty().append( tmp(num + (level-i)*10 ) );

      });

      function tmp(num) {
        var $domFragment = $('<div/>', {"class":"teeth-wrapper"})
        for (var i= 0; i<num + 1; i++) {
          $domFragment.append($('<div/>', {"class":"tooth", text: i % 10}));
        }
        return $domFragment;
      }
    }

    function _roll(arr) {
      var h;
      $.each(arr, function(i, $slot){
        if($slot.hasClass('dot')) return;
        var $wrapper = $('.teeth-wrapper', $slot);
        h = h || $wrapper.children().first().outerHeight();
        $slot.animate(
          {'scrollTop': $wrapper.height() - h},
          {
            duration: 2000,
            easing: "easeInOutExpo"
          }
        );
      });
    }

    function showYield() {
      var yield = fundModel.getYield();
      var slotsArr = _makeSlots(yield);
      console.log(yield);

      if(yield && animation) slotsArr = _makeTeeth(slotsArr);
      $yieldResult.empty().append(slotsArr);

      if(yield && animation) _roll(slotsArr);

    }



    return {
      showYield: showYield,
      init: init
    }
  })();

  cSearch = (function () {
    var
      $search,
      $input,
      $ul
    function init() {
      $search = $('#search-funds');
      $input = $('input', $search)
      $ul = $('ul', $search);
      _bind();
    }

    function _bind() {
      $input.on('keyup', function () {
        search($(this).val());
      });
      $('form', $search).on('submit', function () {
        search($input.val());
        return false;
      });
    }

    function search(keyword) {
      $ul.text('暂时不支持搜索');
    }

    return {init: init}
  })();


  //----- HELPER? ------
  // used by both search and common controller:
  function buildUl (funds){
    //TODO: improve dom performance??
    // TODO: we can iterate and find common ones (or have a `common` object)
    // TODO: try using LESS
    var $ul = $('<ul/>');
    var empty = fm.isMyEmpty();
    $.each(funds, function (code, fund) {
      var has = !empty && fm.myFunds[code];
      $('<li/>', {"class": "clearfix"})
        .append(
          $('<div/>', {"class": "wrapper"})
            .append($('<img/>', {src: fund.img, "class":'img-responsive'}))
            .append(
              $('<div/>', {"class": "subtitle"})
                .append($('<span/>', {text: fund.name, "class": 'name'}))
                .append($('<span/>', {text: fund.code, "class": "code"}))
            )
        )
        .append(
          $('<button/>', {
            text: has ? "已添加" : "添加",type:"button",
            "class": "btn btn-primary btn-block"
          }).prop('disabled',  has ? true : false)
        )
        .data('code', fund.code)
        .appendTo($ul);
    });
    return $ul;
  }



  //----- INIT -----

  fm.add(fundData);
  // TODO: in cTab ?
  $.subscribe('fundvirgin', function () {
    console.log('in fundvirgin');
    $tmpTab.tab('show');
    virgin = true;
  });

  fm.init();

  cMy.init();
  cCommon.init();
  cYield.init();
  cSearch.init();

  // cDoc should be init last (least likely to use first)
  cDoc.init();
  // TODO: make all initially hidden, shown by demand.
  // $.publish('fundemptied');


});
