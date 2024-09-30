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
      parent_id: originalPromptId
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
        { message_id: messageId, content: responseText }
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
  newContent: string,
  threadLevel: number
) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      content: newContent,
      is_branch: true,
      parent_id: originalMessageId,
      thread_level: threadLevel
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

// export const fetchMessagesInConversation = async (conversationId: string) => {
//   // Fetch all user messages in the conversation
//   const { data: messages, error: messageError } = await supabase
//     .from('messages')
//     .select('*')
//     .eq('conversation_id', conversationId)
//     .order('created_at', { ascending: true });

//   if (messageError) throw new Error(`Error fetching messages: ${messageError.message}`);

//   // For each message, fetch the corresponding response and branch count
//   const messagePairs = await Promise.all(
//     messages.map(async (message) => {
//       // Fetch the response associated with this message
//       const { data: response, error: responseError } = await supabase
//         .from('responses')
//         .select('*')
//         .eq('message_id', message.id)
//         .single();

//       if (responseError) throw new Error(`Error fetching response for message ${message.id}: ${responseError.message}`);

//       return [
//         {
//           id: message.id,
//           content: message.content,
//           parent_id: message.parent_id,
//           role: 'user'
//         },
//         {
//           id: response?.id,
//           content: response ? response.content : null,
//           role: 'system',
//         },
//       ].filter(entry => entry.content !== null);  // Remove null entries if no response
//     })
//   );

//   return messagePairs.flat();
// };

export const fetchMessagesInConversation = async (conversationId: number) => {
  // Fetch all user messages in the conversation
  const { data: messages, error: messageError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_branch', false)
    .order('created_at', { ascending: true });

  if (messageError) throw new Error(`Error fetching messages: ${messageError.message}`);

  // Create a map to store the original messages and branches
  const messageMap = {};

  // For each message, fetch its response and branches
  await Promise.all(
    messages.map(async (message) => {
      // Fetch the response for the message
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .select('id, content')
        .eq('message_id', message.id)
        .single();

      if (responseError && responseError.code !== 'PGRST116') {
        // Ignore if no response (PGRST116 = No rows returned), throw other errors
        throw new Error(`Error fetching response for message ${message.id}: ${responseError.message}`);
      }

      // Fetch branches (children) of this message
      const { data: branches, error: branchError } = await supabase
        .from('messages')
        .select('id, content')
        .eq('parent_id', message.id);

      if (branchError) throw new Error(`Error fetching branches for message ${message.id}: ${branchError.message}`);

      // Add the original message to the message map
      messageMap[message.id] = {
        id: message.id,
        branches: [
          {
            id: message.id,
            content: message.content,
            threadLevel: 0, // Original message
            response: response ? { id: response.id, content: response.content } : null,
          },
        ],
      };

      // Add any branches (children) to the message map with threadLevel 1 and fetch their responses
      await Promise.all(
        branches.map(async (branch) => {
          const { data: branchResponse, error: branchResponseError } = await supabase
            .from('responses')
            .select('id, content')
            .eq('message_id', branch.id)
            .single();

          if (branchResponseError && branchResponseError.code !== 'PGRST116') {
            throw new Error(`Error fetching response for branch ${branch.id}: ${branchResponseError.message}`);
          }

          messageMap[message.id].branches.push({
            id: branch.id,
            content: branch.content,
            threadLevel: 1, // This is a branch message
            response: branchResponse ? { id: branchResponse.id, content: branchResponse.content } : null,
          });
        })
      );
    })
  );

  // Convert the messageMap to an array of grouped original messages with branches
  const result = Object.values(messageMap);

  return result;
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

export const fetchBranchedMessages = async (originalPromptId: string) => {
  // Fetch the parent message (original prompt)
  const { data: parentMessage, error: parentError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', originalPromptId)
    .single();

  if (parentError) throw new Error(`Error fetching parent message: ${parentError.message}`);

  // Fetch all branched messages
  const { data: branchedMessages, error: branchError } = await supabase
    .from('messages')
    .select('*')
    .eq('is_branch', true)
    .eq('parent_id', originalPromptId)
    .order('created_at', { ascending: true });

  if (branchError) throw new Error(`Error fetching branched messages: ${branchError.message}`);

  // Create an array for the parent message
  const parentMessageEntry = [{ id: parentMessage.id, content: parentMessage.content, role: 'user' }];

  // Fetch responses for branched messages
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
        { id: response?.id, content: response ? response.content : null, role: 'system' }
      ].filter(entry => entry.content !== null);
    })
  );

  // Return the parent message first, followed by the branched messages
  return [...parentMessageEntry, ...branchedMessagePairs.flat()];
};
