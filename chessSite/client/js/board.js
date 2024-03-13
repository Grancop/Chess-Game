/*$('#Test-User').click(function() {
    $.ajax({
        url: chessURL + "/user",
        type: "get",
        success: function(response){
        var data = JSON.parse(response);
            if(data.msg == "SUCCESS") {
                alert("Welcome, " + data.username);
            } else {
                alert(data.msg);
            }
        },
        error: function(err){
            console.log(err);
        }
    });

    return false;
});*/