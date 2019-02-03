/********************************************************************************
 This file contains the variables and functions that form the main game screen of
 the game. The main game progression (dealing, exchanging, revealing, stripping)
 and everything to do with displaying the main game screen.
 ********************************************************************************/

/**********************************************************************
 *****                    Game Screen UI Elements                 *****
 **********************************************************************/

/* game banner */
$gameBanner = $("#game-banner");

/* main UI elements */
$gameBubbles = [$("#game-bubble-1"),
                $("#game-bubble-2"),
                $("#game-bubble-3"),
                $("#game-bubble-4")];
$gameDialogues = [$("#game-dialogue-1"),
                  $("#game-dialogue-2"),
                  $("#game-dialogue-3"),
                  $("#game-dialogue-4")];
$gameAdvanceButtons = [$("#game-advance-button-1"),
                       $("#game-advance-button-2"),
                       $("#game-advance-button-3"),
                       $("#game-advance-button-4")];
$gameImages = [$("#game-image-1"),
               $("#game-image-2"),
               $("#game-image-3"),
               $("#game-image-4")];
$gameLabels = [$("#game-name-label-0"),
               $("#game-name-label-1"),
               $("#game-name-label-2"),
               $("#game-name-label-3"),
               $("#game-name-label-4")];
$gameOpponentAreas = [$("#game-opponent-area-1"),
                      $("#game-opponent-area-2"),
                      $("#game-opponent-area-3"),
                      $("#game-opponent-area-4")];
$gamePlayerCountdown = $("#player-countdown");
$gamePlayerClothingArea = $("#player-game-clothing-area");
$gamePlayerCardArea = $("#player-game-card-area");

/* dock UI elements */
$gameClothingLabel = $("#game-clothing-label");
$gameClothingCells = [$("#player-0-clothing-1"),
                      $("#player-0-clothing-2"),
                      $("#player-0-clothing-3"),
                      $("#player-0-clothing-4"),
                      $("#player-0-clothing-5"),
                      $("#player-0-clothing-6"),
                      $("#player-0-clothing-7"),
                      $("#player-0-clothing-8")];
$mainButton = $("#main-game-button");
$cardButtons = [$("#player-0-card-1"),
				$("#player-0-card-2"),
				$("#player-0-card-3"),
				$("#player-0-card-4"),
				$("#player-0-card-5")];
$debugButtons = [$("#debug-button-0"),
				 $("#debug-button-1"),
				 $("#debug-button-2"),
				 $("#debug-button-3"),
				 $("#debug-button-4")];

/* restart modal */
$restartModal = $("#restart-modal");

gameDisplays = [
    new GameScreenDisplay(1),
    new GameScreenDisplay(2),
    new GameScreenDisplay(3),
    new GameScreenDisplay(4)
]

/**********************************************************************
 *****                   Game Screen Variables                    *****
 **********************************************************************/

/* pseudo constants */
var GAME_DELAY = 600;
var FORFEIT_DELAY = 7500;
var ENDING_DELAY = 7500;
var GAME_OVER_DELAY = 1000;
var SHOW_ENDING_DELAY = 5000; //5 seconds
var CARD_SUGGEST = false;
var AUTO_FORFEIT = false;
var AUTO_ENDING = false;
var AUTO_FADE = true;
var KEYBINDINGS_ENABLED = false;
var DEBUG = false;

/* colours */
var currentColour = "#63AAE7"; 	/* indicates current turn */
var clearColour = "#FFFFFF";	/* indicates neutral */
var loserColour = "#DD4444";	/* indicates loser of a round */

/* game state */
var eGamePhase = {
	DEAL:      [ "Deal", function() { startDealPhase(); }, true ],
	AITURN:    [ "Next", function() { continueDealPhase(); } ],
	EXCHANGE:  [ "Exchange", function() { completeExchangePhase(); }, true ],
	REVEAL:    [ "Reveal", function() { completeRevealPhase(); }, true ],
	PRESTRIP:  [ "Continue", function() { completeContinuePhase(); }, false ],
	STRIP:     [ "Strip", function() { completeStripPhase(); }, false ],
	FORFEIT:   [ "Masturbate", function() { completeMasturbatePhase(); }, false ],
	END_LOOP:  [ undefined, function() { handleGameOver(); } ],
	GAME_OVER: [ "Ending?", function() { actualMainButtonState = false; doEpilogueModal(); } ],
	END_FORFEIT: [ "Continue..." ], // Specially handled; not a real phase. tickForfeitTimers() will always return true in this state.
};

/* Masturbation Previous State Variables */
var gamePhase = eGamePhase.DEAL;
var globalSavedTableVisibility;

var currentTurn = 0;
var currentRound = -1;
var previousLoser = -1;
var recentLoser = -1;
var gameOver = false;
var actualMainButtonState = false;
var endWaitDisplay = 0;
var showDebug = false;
var chosenDebug = -1;
var autoForfeitTimeoutID; // Remember this specifically so that it can be cleared if auto forfeit is turned off.
var repeatLog = {1:{}, 2:{}, 3:{}, 4:{}};
                      
/**********************************************************************
 *****                    Start Up Functions                      *****
 **********************************************************************/

/************************************************************
 * Loads all of the content required to display the title
 * screen.
 ************************************************************/
function loadGameScreen () {
    $gameScreen.show();

    /* reset all of the player's states */
    for (var i = 1; i < players.length; i++) {
        gameDisplays[i-1].reset(players[i]);
        
        if (players[i]) {
            players[i].current = 0;
        }
    }
    $gameLabels[HUMAN_PLAYER].css({"background-color" : clearColour});
    clearHand(HUMAN_PLAYER);

    recentLoser = -1;
    currentRound = -1;
    gameOver = false;
    $gamePlayerCardArea.show();
    $gamePlayerCountdown.hide();
    chosenDebug = -1;
    updateDebugState(showDebug);
    
    /* randomize start lines for characters using legacy start lines.
     * The updateAllBehaviours() call below will override this for any
     * characters using new-style start lines.
     *
     * Also go ahead and commit any marker updates from selected lines.
     */
    players.forEach(function (p) {
        if(p.chosenState) {
            p.commitBehaviourUpdate();
        }
        
        if (p.allStates) {
            p.chosenState = p.allStates[getRandomNumber(0, p.allStates.length)];
            p.stateCommitted = false;
        }
    }.bind(this));

    updateAllBehaviours(null, null, GAME_START);

    /* set up the poker library */
    setupPoker();
    preloadCardImages();

    /* disable player cards */
    for (var i = 0; i < $cardButtons.length; i++) {
        $cardButtons[i].attr('disabled', true);
    }

    /* enable and set up the main button */
	allowProgression(eGamePhase.DEAL);
    
    /* late settings */
    KEYBINDINGS_ENABLED = true;
    document.addEventListener('keyup', game_keyUp, false);
}

/**********************************************************************
 *****                      Display Functions                     *****
 **********************************************************************/

/************************************************************
 * Updates all of the main visuals on the main game screen.
 ************************************************************/
function updateGameVisual (player) {
    gameDisplays[player-1].update(players[player]);
}

/************************************************************
 * Adds lines to the repeat count and displays if the count > 1.
 ************************************************************/
 function appendRepeats(slot) {
    var current = $gameDialogues[slot-1].html();
    repeatLog[slot][current] = repeatLog[slot][current] + 1 || 1;
    if (repeatLog[slot][current] > 1) {
        $gameDialogues[slot-1].html(current + "<br><span style=\"color:red;\">(" + repeatLog[slot][current] + ")<\span>");
    }
}


/************************************************************
 * Updates all of the main visuals on the main game screen.
 ************************************************************/
function updateAllGameVisuals () {
    /* update all opponents */
    for (var i = 1; i < players.length; i++) {
        updateGameVisual (i);
    }
}

/************************************************************
 * Updates the visuals of the player clothing cells.
 ************************************************************/
function displayHumanPlayerClothing () {
    /* collect the images */
    var clothingImages = players[HUMAN_PLAYER].clothing.map(function(c) {
		return c.image;
	});
    
    /* display the remaining clothing items */
    clothingImages.reverse();
	$gameClothingLabel.html("Your Clothing");
	for (var i = 0; i < 8; i++) {
		if (clothingImages[i]) {
			$gameClothingCells[i].attr('src', clothingImages[i]);
			$gameClothingCells[i].css({opacity: 1});
		} else {
			$gameClothingCells[i].css({opacity: 0});
		}
	}
}

/**********************************************************************
 *****                        Flow Functions                      *****
 **********************************************************************/

/************************************************************
 * Determines what the AI's action will be.
 ************************************************************/
function makeAIDecision () {
	/* determine the AI's decision */
	determineAIAction(players[currentTurn]);
	
	/* dull the cards they are trading in */
	for (var i = 0; i < players[currentTurn].hand.tradeIns.length; i++) {
		if (players[currentTurn].hand.tradeIns[i]) {
			dullCard(currentTurn, i);
		}
	}

	/* update a few hardcoded visuals */
	players[currentTurn].updateBehaviour(SWAP_CARDS);
    players[currentTurn].commitBehaviourUpdate();
	updateGameVisual(currentTurn);

	/* wait and implement AI action */
	timeoutID = window.setTimeout(implementAIAction, GAME_DELAY);
}

/************************************************************
 * Implements the AI's chosen action.
 ************************************************************/
function implementAIAction () {
	exchangeCards(currentTurn);

	/* refresh the hand */
	hideHand(currentTurn);

	/* update behaviour */
	determineHand(players[currentTurn]);
	if (players[currentTurn].hand.strength == HIGH_CARD) {
		players[currentTurn].updateBehaviour([BAD_HAND, ANY_HAND]);
	} else if (players[currentTurn].hand.strength == PAIR) {
		players[currentTurn].updateBehaviour([OKAY_HAND, ANY_HAND]);
	} else {
		players[currentTurn].updateBehaviour([GOOD_HAND, ANY_HAND]);
	}
    
    players[currentTurn].updateVolatileBehaviour();
    players[currentTurn].commitBehaviourUpdate();
	updateGameVisual(currentTurn);

	/* wait and then advance the turn */
	timeoutID = window.setTimeout(advanceTurn, GAME_DELAY);
}

/************************************************************
 * Advances the turn or ends the round.
 ************************************************************/
function advanceTurn () {
	currentTurn++;
	if (currentTurn >= players.length) {
		currentTurn = 0;
	}

    if (players[currentTurn]) {
        /* highlight the player who's turn it is */
        for (var i = 0; i < players.length; i++) {
            if (currentTurn == i) {
                $gameLabels[i].css({"background-color" : currentColour});
            } else {
                $gameLabels[i].css({"background-color" : clearColour});
            }
        }

        /* check to see if they are still in the game */
        if (players[currentTurn].out && currentTurn > 0) {
            /* update their speech and skip their turn */
            players[currentTurn].updateBehaviour(players[currentTurn].forfeit[0]);
            players[currentTurn].commitBehaviourUpdate();
            updateGameVisual(currentTurn);

            timeoutID = window.setTimeout(advanceTurn, GAME_DELAY);
            return;
        }
    }

	/* allow them to take their turn */
	if (currentTurn == 0) {
        /* Reprocess reactions. */
        updateAllVolatileBehaviours();
        
        /* Commit updated states only. */
        players.forEach(function (p) {
            if (p.chosenState && !p.stateCommitted) {
                p.commitBehaviourUpdate();
                updateGameVisual(p.slot);
            }
        });
        
        /* human player's turn */
        if (players[HUMAN_PLAYER].out) {
			allowProgression(eGamePhase.REVEAL);
		} else {
			allowProgression(eGamePhase.EXCHANGE);
		}
	} else if (!players[currentTurn]) {
        /* There is no player here, move on. */
        advanceTurn();
    } else {
        /* AI player's turn */
		makeAIDecision();
	}
}

/************************************************************
 * Deals cards to each player and resets all of the relevant
 * information.
 ************************************************************/
function startDealPhase () {
    currentRound++;
    /* dealing cards */
	dealLock = 0;
    for (var i = 0; i < players.length; i++) {
        if (players[i]) {
            /* collect the player's hand */
            collectPlayerHand(i);
        }
    }
    shuffleDeck();
    for (var i = 0; i < players.length; i++) {
        if (players[i]) {
            console.log(players[i] + " "+ i);
            if (!players[i].out) {
                /* deal out a new hand to this player */
                dealHand(i);
            } else {
                if (HUMAN_PLAYER == i) {
                    $gamePlayerCardArea.hide();
                    $gamePlayerClothingArea.hide();
                }
                else {
                    $gameOpponentAreas[i-1].hide();
                }
            }
            players[i].timeInStage++;
        }
    }

	/* IMPLEMENT STACKING/RANDOMIZED TRIGGERS HERE SO THAT AIs CAN COMMENT ON PLAYER "ACTIONS" */

	/* clear the labels */
	for (var i = 0; i < players.length; i++) {
		$gameLabels[i].css({"background-color" : clearColour});
	}

	timeoutID = window.setTimeout(checkDealLock, (ANIM_DELAY*(players.length))+ANIM_TIME);
}

/************************************************************
 * Checks the deal lock to see if the animation is finished.
 ************************************************************/
function checkDealLock () {
	/* count the players still in the game */
	var inGame = 0;
	for (var i = 0; i < players.length; i++) {
		if (players[i] && !players[i].out) {
			inGame++;
		}
	}

	/* check the deal lock */
	if (dealLock < inGame * 5) {
		timeoutID = window.setTimeout(checkDealLock, 100);
	} else {
		gamePhase = eGamePhase.AITURN;
        /* Set up main button.  If there is not pause for the human
		   player to exchange cards, and someone is masturbating, and
		   the card animation speed is to great, we need a pause so
		   that the masturbation talk can be read. */
        if (players[HUMAN_PLAYER].out && getNumPlayersInStage(STATUS_MASTURBATING) > 0 && ANIM_DELAY < 350) { 
            allowProgression();
        } else {
            continueDealPhase();
        }
    }
}

/************************************************************
 * Finishes the deal phase and allows the game to progress.
 ************************************************************/
function continueDealPhase () {
	/* hide the dialogue bubbles */
    for (var i = 1; i < players.length; i++) {
        $gameDialogues[i-1].html("");
        $gameAdvanceButtons[i-1].css({opacity : 0});
        $gameBubbles[i-1].hide();
    }

	/* set visual state */
    if (!players[HUMAN_PLAYER].out) {
        showHand(HUMAN_PLAYER);
    }

	$mainButton.html("Wait...");
    
    /* enable player cards */
    for (var i = 0; i < $cardButtons.length; i++) {
       $cardButtons[i].attr('disabled', false);
    }

	/* suggest cards to swap, if enabled */
	if (CARD_SUGGEST && !players[HUMAN_PLAYER].out) {
		determineAIAction(players[HUMAN_PLAYER]);
		
		/* dull the cards they are trading in */
		for (var i = 0; i < players[HUMAN_PLAYER].hand.tradeIns.length; i++) {
			if (players[HUMAN_PLAYER].hand.tradeIns[i]) {
				dullCard(HUMAN_PLAYER, i);
			}
		}
	}

    /* Clear all player's chosenStates to allow for limited (in-order-only)
     * reaction processing during the AI turns.
     * (Handling of out-of-order reactions happens at the beginning of the
     *  player turn.)
     */
    players.forEach(function (p) {
        if (p.chosenState) {
            p.chosenState = null;
            p.stateCommitted = false;
        }
    });

    /* allow each of the AIs to take their turns */
    currentTurn = 0;
    advanceTurn();
}

/************************************************************
 * Processes everything required to complete the exchange phase
 * of a round. Trades in the cards the player has selected and
 * draws new ones.
 ************************************************************/
function completeExchangePhase () {
    /* exchange the player's chosen cards */
    exchangeCards(HUMAN_PLAYER);
    showHand(HUMAN_PLAYER);

    /* disable player cards */
    for (var i = 0; i < $cardButtons.length; i++) {
       $cardButtons[i].attr('disabled', true);
    }
    allowProgression(eGamePhase.REVEAL);
}

/************************************************************
 * Processes everything required to complete the reveal phase
 * of a round. Shows everyone's hand and determines who lost
 * the hand.
 ************************************************************/
function completeRevealPhase () {
    /* reveal everyone's hand */
    for (var i = 0; i < players.length; i++) {
        if (players[i] && !players[i].out) {
            determineHand(players[i]);
            showHand(i);
        }
    }

    /* figure out who has the lowest hand */
    previousLoser = recentLoser;
    recentLoser = determineLowestHand();

    if (chosenDebug !== -1 && DEBUG) {
        recentLoser = chosenDebug;
    }

    console.log("Player "+recentLoser+" is the loser.");

    /* look for the unlikely case of an absolute tie */
    if (recentLoser == -1) {
        console.log("Fuck... there was an absolute tie");
        /* inform the player */

        /* hide the dialogue bubbles */
        for (var i = 1; i < players.length; i++) {
            $gameDialogues[i-1].html("");
            $gameAdvanceButtons[i-1].css({opacity : 0});
            $gameBubbles[i-1].hide();
        }

        /* reset the round */
        allowProgression(eGamePhase.DEAL);
        return;
    }

    // update loss history
    if (previousLoser < 0) {
        // first loser
        players[recentLoser].consecutiveLosses = 1;
    }
    else if (previousLoser === recentLoser) {
        // same player lost again
        players[recentLoser].consecutiveLosses++;
    }
    else {
        // a different player lost
        players[previousLoser].consecutiveLosses = 0; //reset last loser
        players[recentLoser].consecutiveLosses = 1;
    }


    /* update behaviour */
	var clothes = playerMustStrip (recentLoser);
    
    /* playerMustStrip() calls updateAllBehaviours. */

    /* highlight the loser */
    for (var i = 0; i < players.length; i++) {
        if (recentLoser == i) {
            $gameLabels[i].css({"background-color" : loserColour});
        } else {
            $gameLabels[i].css({"background-color" : clearColour});
        }
    }

    /* set up the main button */
	if (recentLoser != HUMAN_PLAYER && clothes > 0) {
		allowProgression(eGamePhase.PRESTRIP);
	} else if (clothes == 0) {
		allowProgression(eGamePhase.FORFEIT);
	} else {
		allowProgression(eGamePhase.STRIP);
	}

}

/************************************************************
 * Processes everything required to complete the continue phase
 * of a round. A very short phase in which a player removes an
 * article of clothing.
 ************************************************************/
function completeContinuePhase () {
	/* show the player removing an article of clothing */
	prepareToStripPlayer(recentLoser);
    allowProgression(eGamePhase.STRIP);
}

/************************************************************
 * Processes everything required to complete the strip phase
 * of a round. Makes the losing player strip.
 ************************************************************/
function completeStripPhase () {
    /* strip the player with the lowest hand */
    stripPlayer(recentLoser);
}

/************************************************************
 * Processes everything required to complete the strip phase of a
 * round when the loser has no clothes left. Makes the losing player
 * start their forfeit. May also end the game if only one player
 * remains.
 ************************************************************/
function completeMasturbatePhase () {
    /* strip the player with the lowest hand */
    startMasturbation(recentLoser);
}

/************************************************************
 * Handles everything that happens at the end of the round.
 * Including the checks for the end of game.
 ************************************************************/
function endRound () {
	/* check to see how many players are still in the game */
    var inGame = 0;
    var lastPlayer = 0;
    for (var i = 0; i < players.length; i++) {
        if (players[i] && !players[i].out) {
            inGame++;
            lastPlayer = i;
        }
    }

    /* if there is only one player left, end the game */
    if (inGame <= 1) {
        if (USAGE_TRACKING) {
            var usage_tracking_report = {
                'date': (new Date()).toISOString(),
                'commit': VERSION_COMMIT,
                'type': 'end_game',
                'session': sessionID,
                'game': gameID,
                'userAgent': navigator.userAgent,
                'origin': getReportedOrigin(),
                'table': {},
                'winner': players[lastPlayer].id
            };
            
            for (let i=1;i<5;i++) {
                if (players[i]) {
                    usage_tracking_report.table[i] = players[i].id;
                }
            }
            
            $.ajax({
                url: USAGE_TRACKING_ENDPOINT,
                method: 'POST',
                data: JSON.stringify(usage_tracking_report),
                contentType: 'application/json',
                error: function (jqXHR, status, err) {
                    console.error("Could not send usage tracking report - error "+status+": "+err);
                },
            });
        }
        
		console.log("The game has ended!");
		$gameBanner.html("Game Over! "+players[lastPlayer].label+" won Strip Poker Night at the Inventory!");
		gameOver = true;

        for (var i = 0; i < players.length; i++) {
            if (HUMAN_PLAYER == i) {
                $gamePlayerCardArea.hide();
                $gamePlayerClothingArea.hide();
            }
            else {
                $gameOpponentAreas[i-1].hide();
            }
        }
        endWaitDisplay = 0;
		handleGameOver();
	} else {
		allowProgression(eGamePhase.DEAL);
		preloadCardImages();
	}
}

/************************************************************
 * Handles the end of the game. Currently just waits for all
 * players to finish their forfeits.
 ************************************************************/
function handleGameOver() {
	var winner;

	/* determine true end and identify winner (even though endRound() did that too) */
	if (!players.some(function(p, i) {
		if (!p.out) winner = p;
		return p.out && !p.finished;
	})) {
		/* true end */
        updateAllBehaviours(winner.slot, GAME_OVER_VICTORY, GAME_OVER_DEFEAT);

		allowProgression(eGamePhase.GAME_OVER);
		//window.setTimeout(doEpilogueModal, SHOW_ENDING_DELAY); //start the endings
	} else {
		if (endWaitDisplay == 0) {
			players.forEach(function(p) { p.timeInStage++; });
		}
		allowProgression(eGamePhase.END_LOOP);
	}
}

/**********************************************************************
 *****                    Interaction Functions                   *****
 **********************************************************************/

/************************************************************
 * The player selected one of their cards.
 ************************************************************/
function selectCard (card) {
	players[HUMAN_PLAYER].hand.tradeIns[card] = !players[HUMAN_PLAYER].hand.tradeIns[card];
	
	if (players[HUMAN_PLAYER].hand.tradeIns[card]) {
		dullCard(HUMAN_PLAYER, card);
	} else {
		fillCard(HUMAN_PLAYER, card);
	}
}

/************************************************************
 * Allow progression by enabling the main button *or*
 * setting up the auto forfeit timer.
 ************************************************************/
function allowProgression (nextPhase) {
	if (nextPhase !== undefined && nextPhase !== eGamePhase.END_FORFEIT) {
		gamePhase = nextPhase;
	} else if (nextPhase === undefined) {
		nextPhase = gamePhase;
	}
	
    if (AUTO_FORFEIT && nextPhase != eGamePhase.GAME_OVER && players[HUMAN_PLAYER].out && players[HUMAN_PLAYER].timer > 1) {
        timeoutID = autoForfeitTimeoutID = setTimeout(advanceGame, FORFEIT_DELAY);
    } else if (AUTO_ENDING && nextPhase != eGamePhase.GAME_OVER && (players[HUMAN_PLAYER].finished || (!players[HUMAN_PLAYER].out && gameOver))) {
        /* Human is finished or human is the winner */
        timeoutID = autoForfeitTimeoutID = setTimeout(advanceGame, ENDING_DELAY);
    } else {
        $mainButton.attr('disabled', false);
        actualMainButtonState = false;
    }

	if (players[HUMAN_PLAYER].out && !players[HUMAN_PLAYER].finished && players[HUMAN_PLAYER].timer == 1 && gamePhase != eGamePhase.STRIP) {
		$mainButton.html("Cum!");
	} else if (nextPhase[0]) {
		$mainButton.html(nextPhase[0]);
	} else if (nextPhase === eGamePhase.END_LOOP) { // Special case
        var dots = "";
        for (var i = 0; i < endWaitDisplay; i++) {
            dots += ".";
        }
        endWaitDisplay = (endWaitDisplay + 1) % 4;
        
		/* someone is still forfeiting */
		$mainButton.html("Wait" + dots);
	}
}

/************************************************************
 * The player clicked the main button on the game screen.
 ************************************************************/
function advanceGame () {
    /* disable the button to prevent double clicking */
    $mainButton.attr('disabled', true);
    actualMainButtonState = true;
    autoForfeitTimeoutID = undefined;
    
    /* lower the timers of everyone who is forfeiting */
    if (tickForfeitTimers()) return;

	if (AUTO_FADE && gamePhase[2] !== undefined) {
		forceTableVisibility(gamePhase[2]);
	}
	gamePhase[1]();
}

/************************************************************
 * The player clicked the home button. Shows the restart modal.
 ************************************************************/
function showRestartModal () {
    $restartModal.modal('show');
}

function closeRestartModal() {
	$mainButton.attr('disabled', actualMainButtonState);
}

/************************************************************
 * A keybound handler.
 ************************************************************/
function game_keyUp(e)
{
    console.log(e);
    if (KEYBINDINGS_ENABLED) {
        if (e.keyCode == 32 && !$mainButton.prop('disabled')) { // Space
            advanceGame();
        }
        else if (e.keyCode == 49 && !$cardButtons[4].prop('disabled')) { // 1
            selectCard(4);
        }
        else if (e.keyCode == 50 && !$cardButtons[3].prop('disabled')) { // 2
            selectCard(3);
        }
        else if (e.keyCode == 51 && !$cardButtons[2].prop('disabled')) { // 3
            selectCard(2);
        }
        else if (e.keyCode == 52 && !$cardButtons[1].prop('disabled')) { // 4
            selectCard(1);
        }
        else if (e.keyCode == 53 && !$cardButtons[0].prop('disabled')) { // 5
            selectCard(0);
        }
        else if (e.keyCode == 81 && DEBUG) {
            showDebug = !showDebug;
            updateDebugState(showDebug);
        }
        else if (e.keyCode == 84) {
            toggleTableVisibility();
        }
    }
}


function selectDebug(player)
{
    if (chosenDebug === player) {
        chosenDebug = -1;
    }
    else {
        chosenDebug = player;
    }
    updateDebugState(showDebug);
}


function updateDebugState(show)
{
    if (!show) {
        for (var i = 0; i < $debugButtons.length; i++) {
            $debugButtons[i].hide();
        }
    }
    else {
        for (var i = 0; i < $debugButtons.length; i++) {
            if (players[i] && !players[i].out) {
                $debugButtons[i].show();
                $debugButtons[i].removeClass("active");
            }
        }

        if (chosenDebug !== -1) {
            $debugButtons[chosenDebug].addClass("active");
        }
    }
}
