function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

module.exports = () => {
    if ($('.order__timeleft').length > 0) {
        var order = new Date($('.order__timeleft').data('date')),
            lifetime = $('.order__timeleft').data('lifetime')
        var now = new Date();
        if ((now.getTime() - order.getTime()) / 1000 > 1800) {
            location.href = '/';
        } else {
            var future = addMinutes(order, lifetime);
            var seconds = (future.getTime() - now.getTime()) / 1000;
            setInterval(() => {
                
                var mins = seconds / 60;
                var secs = seconds % 60;

                var min = Math.floor(mins);
                if (min.toString().length < 2) min = '0' + min.toString();

                var sec = Math.floor(secs);
                if (sec.toString().length < 2) sec = '0' + sec.toString();

                $('#timeleft-mins').html(min);
                $('#timeleft-secs').html(sec);

                if (seconds > 1)
                    seconds--;
                else
                    location.href = '/';
            }, 1000);
        }
        
    }
}