
(function ($) {
  'use strict';



  // SLOT CLASS DEFINITION
  // ====================

  var Slot = function (element) {
    this.element = $(element)
    this.dom = _generateDom();
  }

  var $dom;
  function _generateDom() {
    if(!$dom) {
      $dom = $('<div/>', {"class": "slot"})
        .append(_generateTeeth())
    }
    return $dom.clone();
  }

  function _generateTeeth() {
    var i = 10
      , arr
    while(i--) {arr.unshift('<span class="tooth">'+ i +'</span>')}
    return arr.join('');
  }



  Slot.prototype.show = function () {
    var $this    = this.element
    var num = parseInt($this.text());





    if ($this.parent('li').hasClass('active')) return

    var previous = $ul.find('.active:last a')[0]
    var e        = $.Event('show.bs.tab', {
      relatedTarget: previous
    })

    $this.trigger(e)

    if (e.isDefaultPrevented()) return

    var $target = $(selector)

    this.activate($this.parent('li'), $ul)
    this.activate($target, $target.parent(), function () {
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: previous
      })
    })
  }




  // TAB PLUGIN DEFINITION
  // =====================

  var old = $.fn.slot

  $.fn.slot = function ( option ) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('gf.slot')

      if (!data) $this.data('gf.slot', (data = new Slot(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.slot.Constructor = Slot





  // TAB DATA-API
  // ============

  /*$(document).on('click.bs.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
    e.preventDefault()
    $(this).tab('show')
  })*/

})(jQuery);
