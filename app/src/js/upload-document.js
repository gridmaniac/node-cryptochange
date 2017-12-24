module.exports = () => {
    let dataUri = ''

    $('#document').on('change', function() {
        const reader = new FileReader()

        reader.onload = function(e) {
            dataUri = e.target.result
        }

        reader.readAsDataURL($('#document')[0].files[0])
    })

    $('#upload-document').click(function() {
        $.post('/account/orders/document', {
            name: $('#document').val().split('\\').pop(),
            document: dataUri,
            id: $('#order-id').val()
        }, function(res) {
            if (res.err) {
                alert(res.err)
            } else {
                location.href = '/'
            }
        })            
    })
}


            