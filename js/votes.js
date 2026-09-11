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

export function getArgumentVoteStats(argumentId) {

    // Get only the votes belonging to this argument
    const argumentVotes = state.appData.votes.filter(
        vote => vote.argumentId === argumentId
    );

    // Count how many users upvoted
    const upvotes = argumentVotes.filter(
        vote => vote.value === "up"
    ).length;

    // Count how many users downvoted
    const downvotes = argumentVotes.filter(
        vote => vote.value === "down"
    ).length;

    return {
        upvotes,
        downvotes
    };
}
export function voteOnResponse(responseId, value) {

    // A user must be logged in to vote
    if (!state.auth.currentUser) {
        return {
            success: false,
            message: "You must be logged in to vote."
        };
    }

    // A response can only receive an upvote or downvote
    const validVotes = ["up", "down"];

    if (!validVotes.includes(value)) {
        return {
            success: false,
            message: "Invalid vote."
        };
    }

    // Make sure the response actually exists
    const response = state.appData.responses.find(
        response => response.id === responseId
    );

    if (!response) {
        return {
            success: false,
            message: "Response not found."
        };
    }

    // Check whether this user has already voted on this response
    const existingVote = state.appData.votes.find(vote =>
        vote.userId === state.auth.currentUser.id &&
        vote.responseId === responseId
    );

    if (existingVote) {

        // Change the existing vote instead of creating another one
        existingVote.value = value;

    } else {

        // No previous vote exists, so create one
        const vote = {
            userId: state.auth.currentUser.id,
            responseId,
            value
        };

        state.appData.votes.push(vote);
    }

    saveState();

    return {
        success: true
    };
}


export function getResponseVoteStats(responseId) {

    const responseVotes = state.appData.votes.filter(
        vote => vote.responseId === responseId
    );

    const upvotes = responseVotes.filter(
        vote => vote.value === "up"
    ).length;

    const downvotes = responseVotes.filter(
        vote => vote.value === "down"
    ).length;

    return {
        upvotes,
        downvotes
    };
}