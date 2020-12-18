var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

var dynamodb = new AWS.DynamoDB();


var params = {
    TableName : "Movies",
    KeySchema: [       
        { AttributeName: "year", KeyType: "HASH"},  //Partition key
        { AttributeName: "title", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "year", AttributeType: "N" },
        { AttributeName: "title", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "users",
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
dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "friends",
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

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "posts",
    KeySchema: [       
        { AttributeName: "userID", KeyType: "HASH"},  //Partition key
        { AttributeName: "timestamp", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "userID", AttributeType: "S" },
        { AttributeName: "timestamp", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "hashtags",
    KeySchema: [       
        { AttributeName: "hashtag", KeyType: "HASH"},  //Partition key
        { AttributeName: "timestamp", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "hashtag", AttributeType: "S" },
        { AttributeName: "timestamp", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});
var params = {
    TableName : "comments",
    KeySchema: [       
        { AttributeName: "commentID", KeyType: "HASH"}
    ],
    AttributeDefinitions: [       
        { AttributeName: "commeentID", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [ 
        { 
            IndexName: 'postID-index', 
            KeySchema: [
                { AttributeName: 'postID', KeyType: 'HASH' }, 
                { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ]
        }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "interests",
    KeySchema: [       
        { AttributeName: "interest", KeyType: "HASH"},  //Partition key
        { AttributeName: "username", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "interest", AttributeType: "S" },
        { AttributeName: "username", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [ 
        { 
            IndexName: 'username-index', 
            KeySchema: [
                { AttributeName: 'username', KeyType: 'HASH' }
            ]
        }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "news",
    KeySchema: [       
        { AttributeName: "article", KeyType: "HASH"} //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "article", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [ 
        { 
            IndexName: 'date-index', 
            KeySchema: [
                { AttributeName: 'date', KeyType: 'HASH' }
            ]
        }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "articles",
    KeySchema: [       
        { AttributeName: "interest", KeyType: "HASH"},  //Partition key
        { AttributeName: "article", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "interest", AttributeType: "S" },
        { AttributeName: "article", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "reactions",
    KeySchema: [       
        { AttributeName: "username", KeyType: "HASH"},
        { AttributeName: "article", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "username", AttributeType: "S" },
        { AttributeName: "article", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [ 
        { 
            IndexName: 'date-index', 
            KeySchema: [
                { AttributeName: 'date', KeyType: 'HASH' }
            ]
        }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "inverted",
    KeySchema: [       
        { AttributeName: "keyword", KeyType: "HASH"},  //Partition key
        { AttributeName: "article", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "keyword", AttributeType: "S" },
        { AttributeName: "article", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "recommend",
    KeySchema: [       
        { AttributeName: "username", KeyType: "HASH"},  //Partition key
        { AttributeName: "article", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "username", AttributeType: "S" },
        { AttributeName: "article", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "fullnames",
    KeySchema: [       
        { AttributeName: "fullname", KeyType: "HASH"},  //Partition key
        { AttributeName: "username", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "fullname", AttributeType: "S" },
        { AttributeName: "username", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
    TableName : "chats",
    KeySchema: [       
        { AttributeName: "chatID", KeyType: "HASH"},  //Partition key
        { AttributeName: "chatName", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "chatID", AttributeType: "S" },
        { AttributeName: "chatName", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
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
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});
//TODO username?
var params = {
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
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var params = {
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
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});