app.get('/talks', function(request, response) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	  
	  //Makes all lowercase and stems the word
	  var key = request.query.keyword;
	  key = key.toLowerCase();
	  var keyArr = key.split(" ");
	  //Create arrays that will need to be accessed later
	  var queryResults = [];
	  var idPromises = [];
	  var results = [];
	  var repeats = [];
	  var arrayOfPromises = [];
	  //Iterates through the keywords and creates params for that keyword
	  for (var i = 0; i < keyArr.length; i++) {
		  keyArr[i] = stemmer(keyArr[i]);
		  var params = {
				  TableName : "inverted",
				  KeyConditionExpression: "keyword = :terms",
				    ExpressionAttributeValues: {
				        ":terms": keyArr[i]
				    }
				};
		  //Promise to query the keyword is pushed to array of promises
		   idPromises.push(docClient.query(params).promise());
	  }
	  Promise.all(idPromises).then(
			  successResult => {
				  //Adds each talk_id from each keyword query to an array of ids
				  successResult.forEach(function (item) {
					  item.Items.forEach(function (talk) {
						  queryResults.push(talk.inxid);
						})
					});
				},errResult => {
					console.log("failed to get ids");
					response.redirect("/talk?id=1");
					}).then(
							successResult => {
								//Iterates through each id and pushes promise to query for the talk to array of promises
								for (var i = 0; i < queryResults.length; i++) {
									var params = {
											TableName: 'ted_talks',
											KeyConditionExpression: "talk_id = :id",
											ExpressionAttributeValues: {
												":id": parseInt(queryResults[i])
											}
									};
									var newPromise = docClient.query(params).promise();
									arrayOfPromises.push(newPromise);
								}
							},errResult => {
								console.log("failed to get create array of promises");
						  		response.redirect("/");
						  		}).then(function(successResult) {
						  			//Promise.all to resolve promises in array of promises
						  			Promise.all(arrayOfPromises).then(
						  					successResult => {
						  						//Filters and retrieves the talk info for each talk and pushes it to "results" array
						  						successResult.forEach(function (item) {
						  							try {
											  			item.Items[0].topics = JSON5.parse(item.Items[0].topics);
											  			item.Items[0].related_talks = item.Items[0].related_talks.replace(/(\d)*(?:\d: )/g, '"$&');
											  			item.Items[0].related_talks = item.Items[0].related_talks.replace(/(^\d)*(: \B['"a-zA-z])/g, '"$&');
											  			item.Items[0].related_talks = JSON5.parse(item.Items[0].related_talks);
											  			item.Items[0].url = item.Items[0].url.replace(/(https:\/\/w{3})/g, '');
												        repeats.push(item.Items[0]);
						  							}
						  							catch(e) {
						  								console.log("JSON5 parsing error caught");
						  								console.log(e);
						  							}
											  	});
						  						//Finds how many of each talk there are to see which has repeats
						  						var talkFreqs = repeats.reduce((arr, talk) => 
						  						(arr[talk.talk_id] = (arr[talk.talk_id] || 0) + 1, arr), {});
						  						
						  						//For loop based on number of keywords searched. Each iteration will just address
						  						//talks with 'i' keyword matches
						  						for (var i = keyArr.length; i > 0; i--) {
						  							//Array that will only hold talks that had 'i' keyword matches
						  							var tempArr = [];
						  							for (let [key, value] of Object.entries(talkFreqs)) {
						  								if (value == i) {
						  									tempArr.push(key);
						  								}
						  							}
						  							
						  							//Goes through the temp array that only holds talks of 'i' keyword
						  							//matches and adds the talk just once to results array
						  							var tempTalks = [];
						  							tempArr.forEach(function(id) {
						  								var alreadyThere = false;
						  								repeats.forEach(function(talk) {
						  									if (talk.talk_id == id) {
						  										for (var i = 0; i < tempTalks.length; i++) {
						  											if (tempTalks[i].talk_id == id) {
						  												alreadyThere = true;
						  												break;
						  											}
						  										}
						  										if (!alreadyThere) {
						  											tempTalks.push(talk);
						  										}
						  									}
						  								})
						  							})
						  							//Sorts the talks based on descending views
						  							tempTalks.sort(function(a,b) {
						  								return b.views - a.views
						  								});
						  							//Adds talks until there are 15 in results
						  							tempTalks.forEach(function(talk) {
						  								if (results.length < 15) {
						  									results.push(talk);
						  								}
					  								})
						  						}
											  response.render("results", { "search": request.query.keyword, "results": results });
											  		},
										  errResult => {
											  console.log("failed to get talk info")
											  response.redirect("/");
										  });
						  	});
	  
});