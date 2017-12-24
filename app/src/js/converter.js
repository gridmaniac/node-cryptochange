module.exports = () => {
    var rates = $('#target-sum').data('rates'),
        ofixto = $('#origin-sum').data('fixto'),
        tfixto = $('#target-sum').data('fixto');

    $('#origin-sum').on('change type input keyup',function(){
        var sum = $(this).val();
        $('#target-sum').val((+sum*+rates).toFixed(tfixto));
    });
    $('#target-sum').on('change type input keyup',function(){
        var sum = $(this).val();
        $('#origin-sum').val((+sum/+rates).toFixed(ofixto));
    });
}