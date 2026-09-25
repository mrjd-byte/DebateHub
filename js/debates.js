import { state } from "./state.js";
import { saveState } from "./storage.js";

export function createDebate({ title, description, topic, tags }) {

    if (!title || !description || !topic) {
        return {
            success: false,
            message: "Title, description and topic are required."
        };
    }

    if (!state.auth.currentUser) {
        return {
            success: false,
            message: "You must be logged in to create a debate."
        };
    }

    const debate = {
        id: crypto.randomUUID(),
        title,
        description,
        topic,
        tags,
        authorId: state.auth.currentUser.id,
        createdAt: new Date().toISOString()
    };

    state.appData.debates.push(debate);

    saveState();

    return {
        success: true,
        debate
    };
}

//UPDATE DEBATE
export function updateDebate(debateId, { title, description, topic, tags }) {

    if (!state.auth.currentUser) {
        return {
            success: false,
            message: "You must be logged in to update a debate."
        };
    }

    const debate = state.appData.debates.find(
        debate => debate.id === debateId
    );

    if (!debate) {
        return {
            success: false,
            message: "Debate not found."
        };
    }

    // Only the author can update their debate
    if (debate.authorId !== state.auth.currentUser.id) {
        return {
            success: false,
            message: "You can only update your own debate."
        };
    }

    // Basic validation
    if (!title || !description || !topic) {
        return {
            success: false,
            message: "Title, description and topic are required."
        };
    }

    // Update the existing object
    debate.title = title;
    debate.description = description;
    debate.topic = topic;
    debate.tags = tags;

    saveState();

    return {
        success: true,
        debate
    };
}

export function deleteDebate(debateId) {

    // User must be logged in
    if (!state.auth.currentUser) {
        return {
            success: false,
            message: "You must be logged in to delete a debate."
        };
    }

    // Find the debate
    const debate = state.appData.debates.find(
        debate => debate.id === debateId
    );

    if (!debate) {
        return {
            success: false,
            message: "Debate not found."
        };
    }

    // Only the author can delete the debate
    if (debate.authorId !== state.auth.currentUser.id) {
        return {
            success: false,
            message: "You can only delete your own debate."
        };
    }

    // Find all arguments belonging to this debate
    const debateArguments = state.appData.arguments.filter(
        argument => argument.debateId === debateId
    );

    // Get their IDs so we can remove related responses and votes
    const argumentIds = debateArguments.map(
        argument => argument.id
    );

    // Find responses belonging to those arguments
    const responseIds = state.appData.responses
        .filter(response => argumentIds.includes(response.argumentId))
        .map(response => response.id);

    // Remove the debate
    state.appData.debates = state.appData.debates.filter(
        debate => debate.id !== debateId
    );

    // Remove its arguments
    state.appData.arguments = state.appData.arguments.filter(
        argument => argument.debateId !== debateId
    );

    // Remove responses belonging to those arguments
    state.appData.responses = state.appData.responses.filter(
        response => !argumentIds.includes(response.argumentId)
    );

    // Remove votes belonging to deleted arguments/responses
    state.appData.votes = state.appData.votes.filter(
        vote =>
            !argumentIds.includes(vote.argumentId) &&
            !responseIds.includes(vote.responseId)
    );

    // Remove users' positions on this debate
    state.appData.positions = state.appData.positions.filter(
        position => position.debateId !== debateId
    );

    saveState();

    return {
        success: true
    };
}