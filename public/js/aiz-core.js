//custom jquery method for toggle attr
$.fn.toggleAttr = function (attr, attr1, attr2) {
    return this.each(function () {
        var self = $(this);
        if (self.attr(attr) == attr1) self.attr(attr, attr2);
        else self.attr(attr, attr1);
    });
};
(function ($) {
    // USE STRICT
    "use strict";
    AIZ.extra = {
        plusMinus: function(){
            $('.aiz-plus-minus button').on('click', function(e) {
                // console.log(e,this)
                e.preventDefault();

                var fieldName = $(this).attr("data-field");
                var type = $(this).attr("data-type");
                var input = $("input[name='" + fieldName + "']");
                var currentVal = parseInt(input.val());
                

                if (!isNaN(currentVal)) {
                    if (type == "minus") {
                        if (currentVal > input.attr("min")) {
                            input.val(currentVal - 1).change();
                        }
                        if (parseInt(input.val()) == input.attr("min")) {
                            $(this).attr("disabled", true);
                        }
                    } else if (type == "plus") {
                        if (currentVal < input.attr("max")) {
                            input.val(currentVal + 1).change();
                        }
                        if (parseInt(input.val()) == input.attr("max")) {
                            $(this).attr("disabled", true);
                        }
                    }
                } else {
                    input.val(0);
                }
            });
            $('.aiz-plus-minus input').on('change', function () {
                var minValue = parseInt($(this).attr("min"));
                var maxValue = parseInt($(this).attr("max"));
                var valueCurrent = parseInt($(this).val());

                name = $(this).attr("name");
                if (valueCurrent >= minValue) {
                    $(this).siblings("[data-type='minus']").removeAttr("disabled");
                } else {
                    alert("Sorry, the minimum value was reached");
                    $(this).val($(this).data("oldValue"));
                }
                if (valueCurrent <= maxValue) {
                    $(this).siblings("[data-type='plus']").removeAttr("disabled");
                } else {
                    alert("Sorry, the maximum value was reached");
                    $(this).val($(this).data("oldValue"));
                }
            });
        },
        multiModal: function () {
            $(document).on("show.bs.modal", ".modal", function (event) {
                var zIndex = 1040 + 10 * $(".modal:visible").length;
                $(this).css("z-index", zIndex);
                setTimeout(function () {
                    $(".modal-backdrop")
                        .not(".modal-stack")
                        .css("z-index", zIndex - 1)
                        .addClass("modal-stack");
                }, 0);
            });
            $(document).on('hidden.bs.modal', function () {
                if($('.modal.show').length > 0){
                    $('body').addClass('modal-open');
                }
            });
        },
    };

    setInterval(function(){
        AIZ.extra.refreshToken();
    }, 3600000);

    // init aiz plugins, extra options
    AIZ.extra.plusMinus();
    AIZ.extra.multiModal();

})(jQuery);
