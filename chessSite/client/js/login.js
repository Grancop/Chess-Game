//Login
    $('#login-submit').click(function() {
        var username = $('#username').val();
        var password = $('#password').val();

        var jsonString = {username: username, password: password}; 

        $.ajax({
            url: chessURL + '/auth',
            type: 'post',
            data: jsonString,
            success: function(response){
               var data = JSON.parse(response);
               if(data.msg == "SUCCESS") {
                    reroute();
               } else {
                    alert(data.msg);
               }
            },
            error: function(err){
                alert(err);
            }
        });            
        return false;
    });

    //Register
    $('#register-submit').click(function() {
        var username = $('#username').val();
        var password = $('#password').val();

        var jsonString = {username: username, password: password};

        $.ajax({
            url: chessURL + "/register",
            type: "post",
            data: jsonString,
            success: function(response){
                var data = JSON.parse(response);
                if(data.msg == "SUCCESS") {
                    reroute();
                } else {
                    alert(data.msg);
                }
            },
            error: function(err){
                console.log(err);
            }
        });

        return false;
    });

    function reroute() {
        window.location.assign('/board');
    }