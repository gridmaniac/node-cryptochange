module.exports = () => {
    var buttonGetBanner = $('#affiliate-button-get-banner'),
        buttonGetWidget = $('#affiliate-button-get-widget'),
        buttonFinance = $('#affiliate-button-finance'),
        tabGetBanner = $('#affiliate-tab-get-banner'),
        tabGetWidget = $('#affiliate-tab-get-widget'),
        tabFinance = $('#affiliate-tab-finance');

    buttonGetBanner.click(() => {
        if (!buttonGetBanner.hasClass('button-bar__item_type-1-active'))
            buttonGetBanner.addClass('button-bar__item_type-1-active');

        buttonGetWidget.removeClass('button-bar__item_type-1-active');
        buttonFinance.removeClass('button-bar__item_type-1-active');

        tabGetBanner.addClass('tab-container__item_type-active');
        tabGetWidget.removeClass('tab-container__item_type-active');
        tabFinance.removeClass('tab-container__item_type-active');
    });

    buttonGetWidget.click(() => {
        if (!buttonGetWidget.hasClass('button-bar__item_type-1-active'))
            buttonGetWidget.addClass('button-bar__item_type-1-active');

        buttonGetBanner.removeClass('button-bar__item_type-1-active');
        buttonFinance.removeClass('button-bar__item_type-1-active');

        tabGetWidget.addClass('tab-container__item_type-active');
        tabGetBanner.removeClass('tab-container__item_type-active');
        tabFinance.removeClass('tab-container__item_type-active');
    });

    buttonFinance.click(() => {
        if (!buttonFinance.hasClass('button-bar__item_type-1-active'))
            buttonFinance.addClass('button-bar__item_type-1-active');

        buttonGetBanner.removeClass('button-bar__item_type-1-active');
        buttonGetWidget.removeClass('button-bar__item_type-1-active');

        tabFinance.addClass('tab-container__item_type-active');
        tabGetBanner.removeClass('tab-container__item_type-active');
        tabGetWidget.removeClass('tab-container__item_type-active');
    });
};