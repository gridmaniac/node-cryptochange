module.exports = () => {
    var navigationTitle = $(".header-adaptive-navigation__title"),
        navigationItems = $(".header-adaptive-navigation__items");
    var column = $(".column");

    navigationItems.mouseleave(() => {
        navigationItems.removeClass("header-adaptive-navigation__items_expanded");
    });

    navigationTitle.click(() => {        
        var hasClass = navigationItems.hasClass("header-adaptive-navigation__items_expanded");    
        if (!hasClass) {      
            navigationItems.addClass("header-adaptive-navigation__items_expanded");
        } else {      
            navigationItems.removeClass("header-adaptive-navigation__items_expanded");
        }
    });
}