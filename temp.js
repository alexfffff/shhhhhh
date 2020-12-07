/* TEMPORARY FILE WITH CODE TO BE INTEGRATED INTO home.ejs WHEN READY */

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