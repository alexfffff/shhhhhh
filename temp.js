/* TEMPORARY FILE WITH CODE TO BE INTEGRATED WHEN READY */

// ---------- UPDATE AS OF 12/12 ----------
/* HOW TO RUN ALEX'S CODE (JAVA FROM JAVASCRIPT) */
const { exec } = require('child_process');

const filepath = 'java <INSERT PATH TO ALEXS FILE HERE>';

exec(filepath, (error, stdout, stderr) => {
  if (error) {
    console.error(error: ${error.message});
    return;
  }

  if (stderr) {
    console.error(stderr: ${stderr});
    return;
  }

  console.log(stdout:\n${stdout});
});

// ---------- END OF UPDATE 12/12 ----------


// ---------- UPDATE AS OF 12/12 @sclya2000 ----------
/* DATABASE METHOD FOR SEARCHING FOR NEWS ARTICLES FROM A KEYWORD */

/**
* Gets all articles that match the keywords extracted from the search 
*
* @param  searchStr  what the user entered into the search bar
* @param  username   the username of the person searching
* @return Array with the results of the search in the correct order
*/
var db_news_search = function(searchStr, username, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	// Makes all lowercase and stems the word
	var key = searchStr.toLowerCase();
	var keyArr = key.split(" ");
	// Create arrays that will need to be accessed later
	var queryResults = [];
	var articleNamePromises = [];
	var results = [];
	var repeats = [];
    var arrayOfPromises = [];
	
	// map of recommended articles for this user, maps article name to adsorption graph weight
    var recommended = new Map();
    var recommendedArticles = [];
    var newsUsername = "u:".concat(username);
    var paramsRecommended = {
    		TableName: "recommend",
			KeyConditionExpression: "username = :user",
			ExpressionAttributeValues: {
				":user": newsUsername
			}
		};
    
    // query for all of the recommended articles under the user's username
    docClient.query(paramsRecommended).promise().then(
    	successResultRecommended => {
    		// add the recommended articles and weights to the map and list
    		for (let newsArticle of successResultRecommended.Items) {
    			recommended.set(newsArticle.article.substring(2), newsArticle.weight);
    			recommendedArticles.push(newsArticle.article.substring(2));
    		}

    		console.log("----- Map of user's recommended articles to their weight -----");
    	    console.log(recommended);
    	    
    	    // Iterates through the keywords and creates params for that keyword
    		for (var i = 0; i < keyArr.length; i++) {
    			keyArr[i] = stemmer(keyArr[i]);
    			var params = {
    				TableName: "inverted",
    				KeyConditionExpression: "keyword = :terms",
    				ExpressionAttributeValues: {
    					":terms": keyArr[i]
    				}
    			};
    			// Promise to query the keyword is pushed to array of promises
    			articleNamePromises.push(docClient.query(params).promise());
    		}
    		Promise.all(articleNamePromises).then(
    			successResult1 => {
    				// Adds each article from each keyword query to an array of articles
    				successResult1.forEach(function (item) {
    					item.Items.forEach(function (talk) {
    						queryResults.push(talk.article);
    					})
    				});
    			}, errResult => {
    				console.log("failed to get articles");
    				callback(errResult, null);
    			}
    		).then(
    			successResult2 => {
    				// Iterates through each article and pushes promise to query for the talk to array of promises
    				for (var i = 0; i < queryResults.length; i++) {
    					var params = {
    						TableName: 'news',
    						KeyConditionExpression: "article = :article",
    						ExpressionAttributeValues: {
    							":article": queryResults[i]
    						}
    					};
    					var newPromise = docClient.query(params).promise();
    					arrayOfPromises.push(newPromise);
    				}
    			}, errResult => {
    				console.log("failed to create array of promises");
    				callback(errResult, null);
    			}
    		).then(function(successResult2) {
    			// Promise.all to resolve promises in array of promises
    			Promise.all(arrayOfPromises).then(
    				successResult => {
    					// Filters and retrieves the article info for each article and pushes it to "results" array
    					successResult.forEach(function (item) {
    						if (item.Count > 0) {
    							repeats.push(item.Items[0]);
    						}
    					});
    					
    					// Finds how many of each talk there are to see which has repeats
    					var talkFreqs = repeats.reduce((arr, talk) => 
    						(arr[talk.article] = (arr[talk.article] || 0) + 1, arr), {});
    							  						
    						// For loop based on number of keywords searched. Each iteration will just address
    						// talks with 'i' keyword matches
    						for (var i = keyArr.length; i > 0; i--) {
    							// Array that will only hold talks that had 'i' keyword matches
    							var tempArr = [];
    							for (let [key, value] of Object.entries(talkFreqs)) {
    							  	if (value == i) {
    									tempArr.push(key);
    								}
    							}
    							
    							// Goes through the temp array that only holds talks of 'i' keyword
    							// matches and adds the talk just once to results array
    							var tempTalks = [];
    							tempArr.forEach(function(name) {
    								var alreadyThere = false;
    								repeats.forEach(function(talk) {
    									if (talk.article == name) {
    										for (var i = 0; i < tempTalks.length; i++) {
    											if (tempTalks[i].article == name) {
    												  alreadyThere = true;
    												  break;
    											}
    										}
    										if (!alreadyThere) {
    											tempTalks.push(talk);
    										}
    									}
    								});
    							});
    								
	    						// articles recommended and not recommended to the user from the search results
	    						var recommendedToMe = [];
	    						var notRecommendedToMe = [];
	    						
	    						// push every talk in tempTalks into one of the search result arrays
    							for (let talk of tempTalks) {
    								if (recommendedArticles.includes(talk.article)) {
    									recommendedToMe.push(talk);
    								} else {
    									notRecommendedToMe.push(talk);
    								}
    							}
    							
    							// sort the search results in recommendations, descending by weight
    							recommendedToMe.sort(function(a,b) {
    								return ((recommended.get(b.article)) - (recommended.get(a.article)));
    							});
    	    					
    							// append the recommended search results and the not recommended search results
    	    					results = results.concat(recommendedToMe.concat(notRecommendedToMe));
    						}
    						
    						// callback with the finalized article results
    						callback(null, results);
    						
    				}, errResult => {
    					console.log("failed to get article info"); 
    					callback(errResult, null);
    				}
    			);
    		});
    	}, errResultRecommended => {
    		console.log("failed to get user's recommended articles");
    		callback(errResult, null);
    	}
    );
};

// ---------- END OF UPDATE 12/12 ----------



// ---------- UPDATE AS OF 12/7 ----------
// see the following line, copy and paste it whenever there is a "message" field to display in an ejs file

// replaces every underscore in the server-side message with a space to effectively display it on the page
<%=message%> = <%=message%>.replace(/_/g, ' ');

// ---------- END OF UPDATE 12/7 ----------

// Include this code somewhere within script tags
//<script> [UNCOMMENT THIS LINE]

var postsOnClient = [];

function initHomePage() {
    // TODO: ACTUALLY DISPLAY POSTS ON THE HOME PAGE SOMEHOW

    // iterate through all of the posts
    <% posts.forEach(post => { %>

        // TODO: HERE IS WHERE YOU SHOULD WRITE CODE THAT INITIALLY DISPLAYS EVERY POST

        // add each post from the server into the list of posts stored on the client side
        postsOnClient.push("<%=post%>");
    <% }) %>
}

// TODO: ejs form submit button (for making a new post) should have: onclick="makeNewPost()"
// makes a new post when the user submits the form for creating a post
function makeNewPost() {
    // get the user's inputted fields
    var postContent = $('input[name="newPostContent"]').val();
    // TODO: get the timestamp that the user pressed the "post" button when they create a post
    //var postTimestamp = ...
    // TODO: get the hashtags from a user's post (if present)
    //var postHashtags = ...

    $.ajax({
        url: "/wall",
        type: "POST",
        data:
            {
                content: postContent,
                timestamp: postTimestamp,
                hashtag: postHashtags
            },
        success: function(data) {
            // TODO: SHOW THE NEW POST ON THE USER'S HOME PAGE

            // add the new post to the list of posts on the client side
            //postsOnClient.push(theNewPost);
            // TODO: var theNewPost -> THIS MUST BE IN THE SAME FORM AS THE POSTS THAT RETURN FROM THE ARRAY OF POSTS SENT FROM THE DATABASE
        }
    })
}

// automatic refresh every 5 seconds to update home page
var refreshTime = function() {
	// set clock to refresh every 5000 ms
	$("#clock").html((new Date()).toString());
	setTimeout(refreshTime, 5000);
	// make AJAX call to get the home page posts and compare the data from the server to the data on the client
	$.ajax({
			url: "/homepageposts",
			type: "GET",
			success: function(data) {
	    		// list containing the differences between the server and client
				var newPosts = [];
                    
                // iterate through data (posts) sent from server
				data.forEach(p => {
                    // put the post in the list if it's from the server but not on the client
					if (!postsOnClient.includes(p)) {
                        newPosts.push(p);
                        // update the client-side list to contain new posts from the server
                        postsOnClient.push(p);
					}
				});
                    
                // TODO: ACTUALLY DISPLAY THE NEW POSTS THAT THE SERVER HAS SENT TO THE CLIENT
                newPosts.forEach(newPost => {
                    // SEE ABOVE
                });
			},
			error: function(err) {
                // TODO: HANDLE ERRORS WITH AJAX CALLING DATABASE
				alert(err);
			}
		})
};

$(document).ready(function() {
    // CAN CHANGE CSS CODE (THE LINE BELOW) IF THERE ARE CONFLICTS
    $("#clock").css("color", "white");
    setTimeout(refreshTime, 5000);
});

//</script> [UNCOMMENT THIS LINE]
    
// HTML code to display the actual clock on the page [UNCOMMENT ALL OF THE CODE BELOW]
/*
<!-- Display the current time in 5 second intervals (initially black text, hidden on page) -->
<div id="clock"><center><font color="black">Please wait 5 seconds for the time to appear.</font></center></div><br></br>
*/