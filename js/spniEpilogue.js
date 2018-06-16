/* Epilogue UI elements */
$epilogueScreen = $('#epilogue-screen');

$epiloguePrevButton = $('#epilogue-prev-button');
$epilogueNextButton = $('#epilogue-next-button');
$epilogueResetButton = $('#epilogue-restart-button');
$epiloguePrevOnImage = $('#epilogue-prev-on-image');
$epilogueNextOnImage = $('#epilogue-next-on-image');

/* Epilogue selection modal elements */
$epilogueSelectionModal = $('#epilogue-modal'); //the modal box
$epilogueHeader = $('#epilogue-header-text'); //the header text for the epilogue selection box
$epilogueList = $('#epilogue-list'); //the list of epilogues
$epilogueAcceptButton = $('#epilogue-modal-accept-button'); //click this button to go with the chosen ending

var textBoxDivName = "#epilogueDivBox";

var epilogueSelections = []; //references to the epilogue selection UI elements

var winStr = "You've won the game, and possibly made some friends. Who among these players did you become close with?"; //Winning the game, with endings available
var winStrNone = "You've won the game, and possibly made some friends? Unfortunately, none of your competitors are ready for a friend like you.<br>(None of the characters you played with have an ending written.)"; //Player won the game, but none of the characters have an ending written
var lossStr = "Well you lost. And you didn't manage to make any new friends. But you saw some people strip down and show off, and isn't that what life is all about?<br>(You may only view an ending when you win.)"; //Player lost the game. Currently no support for ending scenes when other players win

// Player won the game, but epilogues are disabled.
var winEpiloguesDisabledStr = "You won... but epilogues have been disabled.";

// Player lost the game with epilogues disabled.
var lossEpiloguesDisabledStr = "You lost... but epilogues have been disabled.";

/* NPC chosen for epilogue */
var epilogueCharacter = -1; //the character whose epilogue is playing
var epilogueScreen = 0; //screen in the epilogue
var epilogueTextCount = 0; //current latest text box in the current screen of the epilogue

var epilogues = []; //list of epilogue data objects
var chosenEpilogue = null;

var openEpilogueTextBoxes = []; //currently open text boxes on the Epilogue screen

/************************************************************
 * Return the numerical part of a string s. E.g. "20%" -> 20
 ************************************************************/

function getNumericalPart(s){
	return parseFloat(s); //apparently I don't actually need to remove the % (or anything else) from the string before I do the conversion
}

/************************************************************
 * Return the approriate left: setting so that a text box of the specified width is centred
 * Assumes a % width
 ************************************************************/
function getCenteredPosition(width){
	var w = getNumericalPart(width); //numerical value of the width
	var left = 50 - (w/2); //centre of the text box is at the 50% position
	return left + "%";
}

/************************************************************
 * Load the Epilogue data for a character
 ************************************************************/
function loadEpilogueData(player){
    if (!players[player]) {
        return [];
    }

	var xml = players[player].xml;
	if (!xml) {return [];} //return an empty list if a character doesn't have an XML variable. (Most likely because they're the player.)

	var playerGender = players[HUMAN_PLAYER].gender;

	//get the XML tree that relates to the epilogue, for the specific player gender
	//var epXML = $($.parseXML(xml)).find('epilogue[gender="'+playerGender+'"]'); //use parseXML() so that <image> tags come through properly //IE doesn't like this

	var epilogues = [];

    var all_epilogues = xml.find('epilogue').filter(function (index) {
        /* Returning true from this function adds the current epilogue to the list of selectable epilogues.
         * Conversely, returning false from this function will make the current epilogue not selectable.
         */

        /* 'gender' attribute: the epilogue will only be selectable if the player character has the given gender, or if the epilogue is marked for 'any' gender. */
        var epilogue_gender = $(this).attr('gender');
        if(epilogue_gender) {
            if(epilogue_gender !== playerGender && epilogue_gender !== 'any') {
                // if the gender doesn't match, don't make this epilogue selectable
                return false;
            }
        }

        /* 'markers' attribute: the epilogue will only be selectable if the character has ALL markers listed within the attribute set. */
        var all_marker_attr = $(this).attr('markers');
        if(all_marker_attr) {
            var must_match_markers = all_marker_attr.split(' ');
            for(var i=0;i<must_match_markers.length;i++) {
                if(!(must_match_markers[i] in players[player].markers)) {
                    // if the given marker is not present, don't make this epilogue selectable
                    return false;
                }
            }
        }

        /* 'not-markers' attribute: the epilogue will only be selectable if the character has NO markers listed within the attribute set. */
        var no_marker_attr = $(this).attr('not-markers');
        if(no_marker_attr) {
            var must_not_match_markers = no_marker_attr.split(' ');
            for(var i=0;i<must_not_match_markers.length;i++) {
                if(must_not_match_markers[i] in players[player].markers) {
                    // if the given marker is present, don't make this epilogue selectable
                    return false;
                }
            }
        }

        /* 'any-markers' attribute: the epilogue will only be selectable if the character has at least ONE of the markers listed within the attribute set. */
        var any_marker_attr = $(this).attr('any-markers');
        if(any_marker_attr) {
            var one_must_match_markers = any_marker_attr.split(' ');
            var match_found = false;
            for(var i=0;i<one_must_match_markers.length;i++) {
                if(one_must_match_markers[i] in players[player].markers) {
                    match_found = true;
                    break;
                }
            }

            if(!match_found) {
                /* if no markers in the list matched, don't make this epilogue selectable. */
                return false;
            }

            /* if any marker within the attribute is set, then this condition passes-- fall through and check the other conditions though */
        }

        /* 'alsoplaying-markers' attribute: this epilogue will only be selectable if ALL markers within the attribute are set for any OTHER characters in the game. */
        var alsoplaying_marker_attr = $(this).attr('alsoplaying-markers');
        if(alsoplaying_marker_attr) {
            var markers = alsoplaying_marker_attr.split(' ');
            for(var i=0;i<markers.length;i++) {
                var marker_set = false;

                for(var pl_idx=0;pl_idx<players.length;pl_idx++) {
                    if(pl_idx !== player) {
                        if(markers[i] in players[pl_idx].markers) {
                            marker_set = true;
                            break;
                        }
                    }
                }

                /* if any marker within the attribute is not set, don't make this epilogue selectable */
                if(!marker_set) {
                    return false;
                }
            }
        }

        /* 'alsoplaying-not-markers' attribute: this epilogue will only be selectable if NO markers within the attribute are set for other characters in the game. */
        var alsoplaying_not_marker_attr = $(this).attr('alsoplaying-not-markers');
        if(alsoplaying_not_marker_attr) {
            var markers = alsoplaying_not_marker_attr.split(' ');
            for(var i=0;i<markers.length;i++) {
                var marker_set = false;

                for(var pl_idx=0;pl_idx<players.length;pl_idx++) {
                    if(pl_idx !== player) {
                        if(markers[i] in players[pl_idx].markers) {
                            marker_set = true;
                            break;
                        }
                    }
                }

                /* If any marker within the attribute is set, then don't make the epilogue selectable */
                if(marker_set) {
                    return false;
                }
            }
        }

        /* 'alsoplaying-any-markers' attribute: this epilogue will only be selectable if at least one marker within the attribute are set for any OTHER character in the game. */
        var alsoplaying_any_marker_attr = $(this).attr('alsoplaying-any-markers');
        if(alsoplaying_any_marker_attr) {
            var markers = alsoplaying_any_marker_attr.split(' ');
            var match_found = false;

            for(var i=0;i<markers.length;i++) {
                for(var pl_idx=0;pl_idx<players.length;pl_idx++) {
                    if(pl_idx !== player) {
                        if(markers[i] in players[pl_idx].markers) {
                            match_found = true;
                            break;
                        }
                    }
                }

                if(match_found) {
                    /* break out of all loops */
                    break;
                }
            }

            /* if any marker within the attribute is set, then this condition passes-- fall through and check other conditions (if there are any).
             * Otherwise, don't make this epilogue selectable.
             */
            if(!match_found) {
                return false;
            }
        }

        // if we made it this far the epilogue must be selectable
        return true;
    }).each(function() {
		//use parseXML() so that <image> tags come through properly
		//not using parseXML() because internet explorer doesn't like it

		var epilogueTitle = $(this).find("title").html().trim();

		var screens = []; //the list of screens for the epilogue

		$(this).find("screen").each(function() {
			var image = players[player].folder + $(this).attr("img").trim(); //get the full path for the screen's image
			//use an attribute rather than a tag because IE doesn't like parsing XML

			//get the information for all the text boxes
			var textBoxes = [];
			$(this).find("text").each(function() {

				//the text box's position and width
				var x = $(this).find("x").html().trim();
				var y = $(this).find("y").html().trim();
				var w = $(this).find("width").html();
				var a = $(this).find("arrow").html();

				//the width component is optional. Use a default of 20%.
				if (w) {
					w = w.trim();
				}
				if (!w || (w.length <= 0)) {
					w = "20%"; //default to text boxes having a width of 20%
				}

				//dialogue bubble arrow
				if (a) {
					a = a.trim().toLowerCase();
					if (a.length >= 1) {
						a = "arrow-" + a; //class name for the different arrows. Only use if the writer specified something.
					}
				} else {
					a = "";
				}

				//automatically centre the text box, if the writer wants that.
				if (x.toLowerCase() == "centered") {
					x = getCenteredPosition(w);
				}

				var text = $(this).find("content").html().trim(); //the actual content of the text box

				textBoxes.push({x:x, y:y, width:w, arrow:a, text:text}); //add a textBox object to the list of textBoxes
			});

			screens.push({image:image, textBoxes:textBoxes}); //add a screen object to the list of screens
		});

		if (screens.length > 0) { //if there isn't any epilogue data, don't do anything
			var epilogue = {player:player,title:epilogueTitle,screens:screens}; //epilogue object
			epilogues.push(epilogue);
		}
	});

	return epilogues;
}

/************************************************************
 * Draw Epilogue Text Box num for the current screen
 ************************************************************/
function drawEpilogueBox(num){
	if (num <= openEpilogueTextBoxes.length - 1) return; //have already drawn this box, so don't do anything
	var boxDivName = textBoxDivName+num;
	var screenData = chosenEpilogue.screens[epilogueScreen];
	var boxData = screenData.textBoxes[num];

	//make new div element
	var newEpilogueDiv = $(document.createElement('div')).attr('id', boxDivName);

	//allow the writer to use ~name~ or ~player~ to refer to the player
	var content = boxData.text.split(NAME).join(players[HUMAN_PLAYER].label)
		.split(PLAYER_NAME).join(players[HUMAN_PLAYER].label);

	//add the contents of the text box
	var dialogueID = 'epilogue-dialogue-'+num;
	newEpilogueDiv.after().html(
					'<div id="epilogue-bubble-'+num+'" class="bordered dialogue-bubble-area modal-dialogue">' +
						'<div class="dialogue-area">' +
							'<span id="'+dialogueID+'" class="dialogue-bubble">'+content+'</span>'+
						'</div>' +
					'</div>');

	//use css to position the text box
	newEpilogueDiv.css('position', "absolute");
	newEpilogueDiv.css('left', boxData.x);
	newEpilogueDiv.css('top', boxData.y);
	newEpilogueDiv.css('width', boxData.width);
	//newEpilogueDiv


	//attach new div element to screen
	newEpilogueDiv.appendTo("#epilogue-screen");

	$('#'+dialogueID).addClass(boxData.arrow);

	//keep track of the open Epilogue Text Boxes, so they can be removed later
	openEpilogueTextBoxes.push(newEpilogueDiv);
}

/************************************************************
 * Draw all Epilogue Text Boxes from 0 to num for the current screen
 ************************************************************/
function drawEpilogueBoxesTo(num){
	//the existing text boxes are [0, openEpilogueTextBoxes.length - 1], inclusive

	//if there's too many, close the extra ones
	while (openEpilogueTextBoxes.length - 1 > num){
		var textBox = openEpilogueTextBoxes.pop();
		textBox.remove();
	}

	//if there's not enough boxes open, make the required ones
	for (var i = openEpilogueTextBoxes.length; i <= num; i++){
		drawEpilogueBox(i);
	}
}

/************************************************************
 * Clear any Epilogue Text Boxes
 ************************************************************/
function clearEpilogueBoxes(){
	while (openEpilogueTextBoxes.length > 0){
		var textBox = openEpilogueTextBoxes.pop();
		textBox.remove();
	}
}

/************************************************************
 * Add the epilogue to the Epilogue modal
 ************************************************************/

function addEpilogueEntry(epilogue){
	var num = epilogues.length; //index number of the new epilogue
	var player = players[epilogue.player]

	var nameStr = player.first+" "+player.last;
	if (player.first.length <= 0 || player.last.length <= 0){
		nameStr = player.first+player.last; //only use a space if they have both first and last names
	}

	var epilogueTitle = nameStr+": "+epilogue.title;
	var idName = 'epilogue-option-'+num;
	var clickAction = "selectEpilogue("+num+")";
	var unlocked = save.hasEnding(player.id, epilogue.title) ? " unlocked" : "";

	var htmlStr = '<li id="'+idName+'" class="epilogue-entry'+unlocked+'"><button onclick="'+clickAction+'">'+epilogueTitle+'</button></li>';

	$epilogueList.append(htmlStr);
	epilogueSelections.push($('#'+idName));
}

/************************************************************
 * Clear the Epilogue modal
 ************************************************************/

function clearEpilogueList(){
	$epilogueHeader.html('');
	$epilogueList.html('');
	epilogues = [];
	epilogueSelections = [];
}

/************************************************************
 * The user has clicked on a button to choose a particular Epilogue
 ************************************************************/

function selectEpilogue(epNumber){
	chosenEpilogue = epilogues[epNumber]; //select the chosen epilogues
	epilogueCharacter = chosenEpilogue.player;

	for (var i = 0; i < epilogues.length; i++){
		epilogueSelections[i].removeClass("active"); //make sure no other epilogue is selected
	}
	epilogueSelections[epNumber].addClass("active"); //mark the selected epilogue as selected
	$epilogueAcceptButton.prop("disabled", false); //allow the player to accept the epilogue
}

/************************************************************
 * Show the modal for the player to choose an Epilogue, or restart the game.
 ************************************************************/
function doEpilogueModal(){

	clearEpilogueList(); //remove any already loaded epilogues
	chosenEpilogue = null; //reset any currently-chosen epilogue
	$epilogueAcceptButton.prop("disabled", true); //don't let the player accept an epilogue until they've chosen one

	//identify the winning player
	var winner = -1;
	for (var i = 0; i < players.length; i++){
		if (players[i] && !players[i].out){
			winner = i;
			break;
		}
	}

	//whether or not the human player won
	var playerWon = (winner == HUMAN_PLAYER);

	if (EPILOGUES_ENABLED && playerWon) { //all the epilogues are for when the player wins, so don't allow them to choose one if they lost
		//load the epilogue data for each player
		for (var i = 0; i < players.length; i++){
			var playerIEpilogues = loadEpilogueData(i);
			for (var j = 0; j < playerIEpilogues.length; j++){
				addEpilogueEntry(playerIEpilogues[j]);
				epilogues.push(playerIEpilogues[j]);
			}
		}
	}

	//are there any epilogues available for the player to see?
	var haveEpilogues = (epilogues.length >= 1); //whether or not there are any epilogues available
	$epilogueAcceptButton.css("visibility", haveEpilogues ? "visible" : "hidden");

    if(EPILOGUES_ENABLED) {
        //decide which header string to show the player. This describes the situation.
    	var headerStr = '';
    	if (playerWon){
    		headerStr = winStr; //player won, and there are epilogues available
    		if (!haveEpilogues){
    			headerStr = winStrNone; //player won, but none of the NPCs have epilogues
    		}
    	} else {
    		headerStr = lossStr; //player lost
    	}
    } else {
        if(playerWon) {
            headerStr = winEpiloguesDisabledStr;
        } else {
            headerStr = lossEpiloguesDisabledStr;
        }
    }

	$epilogueHeader.html(headerStr); //set the header string
	$epilogueSelectionModal.modal("show");//show the epilogue selection modal
}

/************************************************************
 * Start the Epilogue
 ************************************************************/
function doEpilogue(){
	save.addEnding(players[chosenEpilogue.player].id, chosenEpilogue.title);
	//just in case, clear any open text boxes
	clearEpilogueBoxes();

	epilogueScreen = 0; //reset epilogue position in case a previous epilogue played before this one
	epilogueText = 0;

	progressEpilogue(0); //initialise buttons and text boxes
	screenTransition($titleScreen, $epilogueScreen); //currently transitioning from title screen, because this is for testing
	$epilogueSelectionModal.modal("hide");
}

/************************************************************
 * Move the Epilogue forwards and backwards.
 ************************************************************/

function progressEpilogue(direction){
	//direction should be +1 to move to the next line, -1 to go to the previous line
	var screens = chosenEpilogue.screens; //the epilogue being shown
	var fullOpacity = 1;
	var disabledOpacity = 0.4;

	epilogueTextCount += direction;

	if (epilogueTextCount < 0){ //moving back, possibly to the previous screen
		epilogueScreen--;
		if (epilogueScreen < 0){ //not actually changing screen
			epilogueScreen = 0;
			epilogueTextCount = 0; //if already on the first screen, stay at the first position
		} else {
			epilogueTextCount = screens[epilogueScreen].textBoxes.length - 1; //set text box count to the final box in the new current screen
			clearEpilogueBoxes();
		}

	} else if (epilogueTextCount >= screens[epilogueScreen].textBoxes.length){ //moving forwards, possibly to the next screen
		epilogueScreen++;
		if (epilogueScreen >= screens.length){ //not actually changing screen
			epilogueScreen = screens.length - 1;
			epilogueTextCount = screens[epilogueScreen].textBoxes.length - 1;
		} else {
			epilogueTextCount = 0;
			clearEpilogueBoxes();
		}
	}

	drawEpilogueBoxesTo(epilogueTextCount); //actually draw the text boxes

	var screen = screens[epilogueScreen]; //the current screen, after the next/prev button is pressed

	var atFirst = (epilogueScreen <= 0) && (epilogueTextCount <= 0); //at the first position. disable the "previous" button
	var atLast  = (epilogueScreen >= screens.length - 1) && (epilogueTextCount >= screen.textBoxes.length - 1); //at the last position. disable the "next" button and enable the "restart" button

	//set previous/next/restart buttons properly
	$epiloguePrevButton.prop("disabled", atFirst);
	$epilogueNextButton.prop("disabled",  atLast);
	$epilogueResetButton.prop("disabled", !atLast);
    $epiloguePrevOnImage.prop("disabled", atFirst);
    $epilogueNextOnImage.prop("disabled", atLast);
	$epiloguePrevButton.css("opacity", atFirst ? disabledOpacity : fullOpacity);
	$epilogueNextButton.css("opacity", atLast  ? disabledOpacity : fullOpacity);
	$epilogueResetButton.css("visibility", atLast ? "visible" : "hidden");

	//set the background image
	var imageString = "url("+ screen.image + ")";
	//console.log("setting image string to: "+imageString);
	$epilogueScreen.css('background-image', imageString);
}
