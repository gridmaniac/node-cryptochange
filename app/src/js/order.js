var modal = require('./modal');

module.exports = () => {
    $('#submit-exchange').click(() => {
        var origin = $('#origin-dropdown-selected-item').data().walletAlias;
        var target = $('#target-dropdown-selected-item').data().walletAlias;
        var osum = $('#origin-sum').val();
        var tsum = $('#target-sum').val();

        var email = $('#email').val();

        var originInputs = $('#origin-requisites input');
        var originRequisites = [];
            originInputs.each(function(i, input){
            originRequisites.push($(input).val());
        });

        var targetInputs = $('#target-requisites input');
        var targetRequisites = [];
            targetInputs.each(function(i, input){
            targetRequisites.push($(input).val());
        });

        var rates = $('#target-sum').data('rates');

        var data = {
            origin: origin,
            target: target,
            osum: osum,
            tsum: tsum,
            email: email,
            rates: rates,
            originRequisites: originRequisites,
            targetRequisites: targetRequisites
        }

        $.post('/exchange', { data: JSON.stringify(data) }, (res) => {
            if (res.err) {
                modal.error(res.err);
            } else {
                var path = "http://" + window.location.host + "/account/orders/" + res.id;
                window.location.href = path;
            }
        });
    });
}
