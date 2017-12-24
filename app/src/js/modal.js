module.exports.error = (message) => {
    $('#modal-error .modal-body').html(message);
    $('#modal-error').modal();
}