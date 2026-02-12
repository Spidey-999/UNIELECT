<?php
//waiting ....
//pls insert your database credentials
    $db_name = "neondb";
    $db_host = "";
    $db_user = "neaondb_owner";
    $db_password = "neondb";
    $server_db = "";
    //
    $port = "5432";

//creating sever connection u can go with **new mysqli connec
// $conn = new mysqli(
//     $db_name ,
//     $db_user,
//     $db_password,
//     $db_name
// );


//using postgreSql 

$str = 



//check for connection wheather all thing are set
if($conn->connect_error){
    echo'
        <script>
            alert("Error connecting database")
        </script>
    ';
}else{
    echo'
        <script>
            alert("Connected database")
        </script>
    ';
}
?>