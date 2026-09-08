import { state } from "./state.js";
import { saveState } from "./storage.js";

export function voteOnArgument(argumentId, value) {

    // A user must be logged in to vote
    if (!state.auth.currentUser) {
        return {
            success: false,
            message: "You must be logged in to vote."
        };
    }

    // An argument can only receive an upvote or downvote
    const validVotes = ["up", "down"];

    if (!validVotes.includes(value)) {
        return {
            success: false,
            message: "Invalid vote."
        };
    }

    // Make sure the argument we're trying to vote on actually exists
    const argument = state.appData.arguments.find(
        argument => argument.id === argumentId
    );

    if (!argument) {
        return {
            success: false,
            message: "Argument not found."
        };
    }

    // Check whether this user has already voted on this argument
    const existingVote = state.appData.votes.find(vote =>
        vote.userId === state.auth.currentUser.id &&
        vote.argumentId === argumentId
    );

    if (existingVote) {

        // If a vote already exists, change it instead of creating
        // another vote for the same user and argument
        existingVote.value = value;

    } else {

        // No previous vote exists, so create the user's first vote
        const vote = {
            userId: state.auth.currentUser.id,
            argumentId,
            value
        };

        state.appData.votes.push(vote);
    }

    // Persist the updated votes
    saveState();

    return {
        success: true
    };
}