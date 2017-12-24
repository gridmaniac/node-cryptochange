var modal = require('./modal')

module.exports = () => {
    $('#wallet-requisites').change(function() {
        $.getJSON('/account/requisites/' + $(this).val(), (res) => {
            updateRequisites(res.requisites)
            $('#wallet-icon').attr('src', '/i/' + res.icon)
            $('#wallet-title').html('Создать шаблон автозаполнения ' + res.title + ' ' + res.code)
            $('#wallet-alias').val(res.alias)
        })
    })

    $('#add-requisite').click(function() {
        let requisites = []
        $('.requisite').each(function() {
            requisites.push($(this).val())
        })

        const data = {
            wallet: $('#wallet-alias').val(),
            requisites
        }

        $.post('/account/requisites/add', { data: JSON.stringify(data) }, (res) => {
            if (res.err) {
                modal.error(res.err)
            } else {
                const path = 'http://' + window.location.host + '/account/requisites/'
                window.location.href = path
            }
        })
    })

    $('.origin-requisite').click(function() {
        const requisites = $(this).data('requisite').split(';')
        $.each($('#origin-requisites input'), function(i) {
            $(this).val(requisites[i])
        })
    })
    
    $('.target-requisite').click(function() {
        const requisites = $(this).data('requisite').split(';')
        $.each($('#target-requisites input'), function(i) {
            $(this).val(requisites[i])
        })
    })
}

function updateRequisites(reqs) {
    $('#requisites').empty()
    for (let req of reqs) {
        $('#requisites').append(`
            <form-group>
                <label>${req.title}</label>
                <input class='form-control requisite' type='text' placeholder='${req.placeholder}')>
            </form-group>
        `)
    }
}