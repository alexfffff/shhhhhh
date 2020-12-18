var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();

var initTables = function(callback) {
    var usersParams = {
        TableName: "users",
        KeySchema: [       
            { AttributeName: "username", KeyType: "HASH"}  //Partition key
        ],
        AttributeDefinitions: [       
            { AttributeName: "username", AttributeType: "S" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 10, 
            WriteCapacityUnits: 10
        }
    };

    db.createTable(usersParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var friendParams = {
        TableName: "friends",
        KeySchema: [       
            { AttributeName: "yourUsername", KeyType: "HASH"},  //Partition key
            { AttributeName: "friendUsername", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "yourUsername", AttributeType: "S" },
            { AttributeName: "friendUsername", AttributeType: "S" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 10, 
            WriteCapacityUnits: 10
        }
    };

    db.createTable(friendParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var postParams = {
        TableName: "posts",
        KeySchema: [
            { AttributeName: "userID", KeyType: "HASH"},  //Partition key
            { AttributeName: "timestamp", KeyType: "RANGE"}
        ],
        AttributeDefinitions: [
            { AttributeName: "userID", AttributeType: "S" },
            { AttributeName: "posterID", AttributeType: "S" },
            { AttributeName: "timestamp", AttributeType: "N" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        },
        GlobalSecondaryIndexes: [
            { 
                IndexName: 'posterID-index', 
                Projection: {
                    ProjectionType: 'KEYS_ONLY'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                },
                KeySchema: [
                    { AttributeName: 'posterID', KeyType: 'HASH' }
                ]
            }
        ]
    };

    db.createTable(postParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var hashtagParams = {
        TableName: "hashtags",
        KeySchema: [
            { AttributeName: "hashtag", KeyType: "HASH"},  //Partition key
            { AttributeName: "timestamp", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: "hashtag", AttributeType: "S" },
            { AttributeName: "timestamp", AttributeType: "N" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    db.createTable(hashtagParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });


    var commentParams = {
        TableName: "comments",
        KeySchema: [
            { AttributeName: "commentID", KeyType: "HASH"},  //Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: "commentID", AttributeType: "S" },
            { AttributeName: "postID", AttributeType: "S" },
            { AttributeName: "timestamp", AttributeType: "N" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        },
        GlobalSecondaryIndexes: [
            { 
                IndexName: 'postID-index', 
                Projection: {
                    ProjectionType: 'KEYS_ONLY'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                },
                KeySchema: [
                    { AttributeName: 'postID', KeyType: 'HASH' }, 
                    { AttributeName: 'timestamp', KeyType: 'RANGE' }
                ]
            }
        ]
    };

    db.createTable(commentParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var interestParams = {
        TableName: "interests",
        KeySchema: [       
            { AttributeName: "interest", KeyType: "HASH"},  //Partition key
            { AttributeName: "username", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: "interest", AttributeType: "S" },
            { AttributeName: "username", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        },
        GlobalSecondaryIndexes: [
            { 
                IndexName: 'username-index', 
                Projection: {
                    ProjectionType: 'KEYS_ONLY'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                },
                KeySchema: [
                    { AttributeName: 'username', KeyType: 'HASH' }
                ]
            }
        ]
    };

    db.createTable(interestParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var newsParams = {
        TableName: "news",
        KeySchema: [       
            { AttributeName: "article", KeyType: "HASH"} //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "article", AttributeType: "S" },
            { AttributeName: "date", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        },
        GlobalSecondaryIndexes: [
            { 
                IndexName: 'date-index', 
                Projection: {
                    ProjectionType: 'KEYS_ONLY'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                },
                KeySchema: [
                    { AttributeName: 'date', KeyType: 'HASH' }
                ]
            }
        ]
    };

    db.createTable(newsParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });




    var reactionsParams = {
        TableName: "reactions",
        KeySchema: [       
            { AttributeName: "username", KeyType: "HASH"},
            { AttributeName: "article", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "username", AttributeType: "S" },
            { AttributeName: "article", AttributeType: "S" },
            { AttributeName: "date", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        },
        GlobalSecondaryIndexes: [
            { 
                IndexName: 'date-index', 
                Projection: {
                    ProjectionType: 'KEYS_ONLY'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                },
                KeySchema: [
                    { AttributeName: 'date', KeyType: 'HASH' }
                ]
            }
        ]
    };

    db.createTable(reactionsParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var invertedParams = {
        TableName: "inverted",
        KeySchema: [       
            { AttributeName: "keyword", KeyType: "HASH"},  //Partition key
            { AttributeName: "article", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "keyword", AttributeType: "S" },
            { AttributeName: "article", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    db.createTable(invertedParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });


    var recParams = {
        TableName: "recommend",
        KeySchema: [       
            { AttributeName: "username", KeyType: "HASH"},  //Partition key
            { AttributeName: "article", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "username", AttributeType: "S" },
            { AttributeName: "article", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    db.createTable(recParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var fullnameParams = {
        TableName: "fullnames",
        KeySchema: [       
            { AttributeName: "fullname", KeyType: "HASH"},  //Partition key
            { AttributeName: "username", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "fullname", AttributeType: "S" },
            { AttributeName: "username", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    db.createTable(fullnameParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var chatsParams = {
        TableName: "chats",
        KeySchema: [       
            { AttributeName: "chatID", KeyType: "HASH"}
        ],
        AttributeDefinitions: [       
            { AttributeName: "chatID", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    db.createTable(chatsParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });


    var chatUsersParams = {
        TableName : "chatUsers",
        KeySchema: [       
            { AttributeName: "chatID", KeyType: "HASH"},  //Partition key
            { AttributeName: "username", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "chatID", AttributeType: "S" },
            { AttributeName: "username", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    db.createTable(chatUsersParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });


    var msgsParams = {
        TableName : "messages",
        KeySchema: [       
            { AttributeName: "chatID", KeyType: "HASH"},  //Partition key
            { AttributeName: "timestamp", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "chatID", AttributeType: "S" },
            { AttributeName: "timestamp", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    db.createTable(msgsParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var chatInvParams = {
        TableName : "chatInvitations",
        KeySchema: [       
            { AttributeName: "username", KeyType: "HASH"},  //Partition key
            { AttributeName: "chatID", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "username", AttributeType: "S" },
            { AttributeName: "chatID", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    db.createTable(chatInvParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });



    var prefixParams = {
        TableName : "namePrefixes",
        KeySchema: [       
            { AttributeName: "prefix", KeyType: "HASH"},  //Partition key
            { AttributeName: "fullname", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "prefix", AttributeType: "S" },
            { AttributeName: "fullname", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    db.createTable(prefixParams, function(tableErr, tableData) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });





}



initTables(function(err, data) {
	if (err) {
		console.log("error");
		console.log(err);
	} else {
		console.log("success");
	}
});



