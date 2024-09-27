import { supabase } from './supabase'

// Function to create a new conversation
export const createConversation = async (title:string) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ title: title ? title : "New Conversation" }])
    .select();

  if (error) throw new Error(`Error creating conversation: ${error.message}`);
  return data;
};

// Function to send a message (either original or branch)
export const sendMessage = async (
  conversationId: string,
  content: string,
  isBranch: boolean = false,
  originalPromptId: number | null = null
) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      content,
      is_branch: isBranch,
      original_prompt_id: originalPromptId
    }])
    .select();

  if (error) throw new Error(`Error sending message: ${error.message}`);
  return data;
};

export const saveResponse = async (messageId: number, responseText: string) => {
  try {
    const { data, error } = await supabase
      .from('responses')
      .insert([
        { message_id: messageId, response_text: responseText }
      ])
      .select('id, created_at'); // Optionally select the returned fields

    if (error) {
      throw new Error(error.message);
    }

    return data[0]; // Return the inserted response with its ID and timestamp
  } catch (error) {
    console.error("Error saving response:", error);
    throw new Error("Unable to save response"); // Throw a more user-friendly error
  }
};

// Function to edit an existing message (create a branch)
export const editMessage = async (
  conversationId: number,
  originalMessageId: number,
  newContent: string
) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      content: newContent,
      is_branch: true,
      original_prompt_id: originalMessageId
    }])
    .select();

  if (error) throw new Error(`Error editing message: ${error.message}`);
  return data;
};

export const fetchConversations = async () => {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching conversations: ${error.message}`);

  return conversations;
};

// Function to fetch all messages and their corresponding responses in a conversation
export const fetchMessagesInConversation = async (conversationId: string) => {
  // Fetch all user messages in the conversation
  const { data: messages, error: messageError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messageError) throw new Error(`Error fetching messages: ${messageError.message}`);

  // For each message, fetch the corresponding response from the Responses table
  const messagePairs = await Promise.all(
    messages.map(async (message) => {
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .select('*')
        .eq('message_id', message.id)
        .single();

      if (responseError) throw new Error(`Error fetching response for message ${message.id}: ${responseError.message}`);

      return [
        { id: message.id, content: message.content, role: 'user' },
        { id: response.id, content: response ? response.response_text : null, role: 'system' }
      ].filter(entry => entry.content !== null);  // Remove null entries if no response
    })
  );

  console.log(messages.flat())

  return messagePairs.flat();
};

export const clearAllConversations = async () => {
  try {
    // Step 1: Delete all responses
    const { error: responseError } = await supabase
      .from('responses')
      .delete()
      .neq('id', 0); // This is a workaround to delete all rows since Supabase doesn't allow deleting without a condition

    if (responseError) {
      throw new Error(`Failed to clear responses: ${responseError.message}`);
    }
    console.log('All responses cleared.');

    // Step 2: Delete all messages
    const { error: messageError } = await supabase
      .from('messages')
      .delete()
      .neq('id', 0); // Same workaround for messages

    if (messageError) {
      throw new Error(`Failed to clear messages: ${messageError.message}`);
    }
    console.log('All messages cleared.');

    // Step 3: Delete all conversations
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .neq('id', 0); // Same workaround for conversations

    if (conversationError) {
      throw new Error(`Failed to clear conversations: ${conversationError.message}`);
    }
    console.log('All conversations cleared.');

  } catch (error) {
    console.error('Error clearing conversations:', error);
  }
};

// Function to fetch all messages that are branches of a specific prompt
export const fetchBranchedMessages = async (originalPromptId: number) => {
  const { data: branchedMessages, error: branchError } = await supabase
    .from('messages')
    .select('*')
    .eq('is_branch', true)
    .eq('original_prompt_id', originalPromptId)
    .order('created_at', { ascending: true });

  if (branchError) throw new Error(`Error fetching branched messages: ${branchError.message}`);

  const branchedMessagePairs = await Promise.all(
    branchedMessages.map(async (message) => {
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .select('*')
        .eq('message_id', message.id)
        .single();

      if (responseError) throw new Error(`Error fetching response for message ${message.id}: ${responseError.message}`);

      return [
        { id: message.id, content: message.content, role: 'user' },
        { id: response?.id, content: response ? response.response_text : null, role: 'system' }
      ].filter(entry => entry.content !== null); 
    })
  );

  return branchedMessagePairs.flat();
};