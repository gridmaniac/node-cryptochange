var modal = require('./modal');

module.exports = () => {
    $('#auth-form').submit(function(e) {
        e.preventDefault();
        debugger;

        const email = $(this).find('input:first').val(),
              password = $(this).find('input:last').val();
        
        $.post('/login', {
                email: email,
                password: password
        }, (res) => {
            if (res.err) {
                $('#auth-message')
                    .show()
                    .html(res.err);
            } else
                location.href = '/account/orders';
        });
    });

    $('#signup-form').submit(function(e) {
        e.preventDefault();

        const email = $(this).find('#email').val(),
              password = $(this).find('#password').val(),
              retry = $(this).find('#retry').val();
        
        $.post('/register', {
                email: email,
                password: password,
                retry: retry
        }, (res) => {
            if (res.err) {
                modal.error(res.err);
            } else
                location.href = '/account/orders';
        });
    });
};