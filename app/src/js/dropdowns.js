var setExchangeDirection = (origin, target) => {  
  var path = "http://" + window.location.host + "/obmen-" + origin + "-na-" + target
      window.location.href = path
}

module.exports = () => {
    // set item on click
    const originList = $("#origin-dropdown-list"),
          targetList = $("#target-dropdown-list")

    var originItems = originList.find('.input__dropdown-list-item'),
        targetItems = targetList.find('.input__dropdown-list-item')

    var originSelected = $("#origin-dropdown-selected-item"),
        targetSelected = $("#target-dropdown-selected-item")

    originItems.each(function (index) {
        $(this).click(() => {
            originList.removeClass("input__dropdown-list_expanded")
            var data = $(this)[0].dataset,
                walletAlias = data.walletAlias,
                walletTitle = data.walletTitle,
                walletMinTransfer = data.walletMinTransfer,
                walletCode = data.walletCode,
                walletIcon = data.walletIcon,
                src = "/i/" + walletIcon

            originSelected.attr("data-wallet-alias", walletAlias)
            originSelected.find('img').attr("src", src)
            originSelected.find('p').text(walletTitle)

            $('#origin-min-transfer').find('p').text('min: ' + walletMinTransfer + ' '  + walletCode)
            var targetAlias = $("#target-dropdown-selected-item").data().walletAlias      
            
            targetList.addClass("input__dropdown-list_expanded")
        })
    })

    targetItems.each(function (index) {
        $(this).click(() => {
            targetList.removeClass("input__dropdown-list_expanded")
            var data = $(this)[0].dataset,
                walletAlias = data.walletAlias,
                walletTitle = data.walletTitle,
                walletBalance = data.walletBalance,
                walletCode = data.walletCode,
                walletIcon = data.walletIcon,
                src = "/i/" + walletIcon

            targetSelected.attr("data-wallet-alias", walletAlias)
            targetSelected.find('img').attr("src", src)
            targetSelected.find('p').text(walletTitle)

            $('#target-balance').find('p').text('Резерв: ' + walletBalance + ' ' + String(walletCode).toLowerCase())
            var originAlias = $("#origin-dropdown-selected-item").data().walletAlias
            setExchangeDirection(originAlias, walletAlias)
        })
    })

    // open/close on click close on mouseleave
    var originDropdown = $("#origin-dropdown")
    var targetDropdown = $("#target-dropdown")

    targetList.mouseleave(() => {
        targetList.removeClass("input__dropdown-list_expanded")
    })
    originList.mouseleave(() => {
        originList.removeClass("input__dropdown-list_expanded")
    })

    targetDropdown.click(() => {
        originList.removeClass("input__dropdown-list_expanded")
        var hasClass = targetList.hasClass("input__dropdown-list_expanded")
        if (!hasClass) {
            targetList.addClass("input__dropdown-list_expanded")
        } else {
            targetList.removeClass("input__dropdown-list_expanded")
        }
    })

    originDropdown.click(() => {
        targetList.removeClass("input__dropdown-list_expanded")
        var hasClass = originList.hasClass("input__dropdown-list_expanded")
        if (!hasClass) {
            originList.addClass("input__dropdown-list_expanded")
        } else {
            originList.removeClass("input__dropdown-list_expanded")
        }
    })
}