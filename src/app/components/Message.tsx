import { SiOpenai } from "react-icons/si";
import { HiUser } from "react-icons/hi";
import { TbCursorText } from "react-icons/tb";
import { FiEdit3 } from "react-icons/fi";
import { useState } from "react";
import { editMessage as editMessageApi, saveResponse } from '../../../lib/api'; 
import { generateAIResponse } from "../../../lib/aiResponses";

const Message = (props: any) => {
  const { message, conversationId, setConversation, setShowModal, setSelectedbranchId } = props; 
  const { id: originalMessageId, role, content: text } = message; 
  const [editMessage, setEditMessage] = useState(text); 
  const [isEditing, setIsEditing] = useState(false); 

  const isUser = role === "user";

  const handleSave = async () => {
    try {
      const sentMsg = await editMessageApi(conversationId, originalMessageId, editMessage); 
      setIsEditing(false); 
      setConversation((prev: any) => [
        ...prev,
        { id: sentMsg[0].id, content: editMessage, role: "user" },
        { id: Math.random() * 1000, content: null, role: "system" },
      ]);
  
  
      setTimeout(async () => {
        const simulatedResponse = generateAIResponse(); // Generate AI response (Just a simulated response)

        // Add the simulated AI response to the conversation
        setConversation((prev: any) => {
          const updatedConversation = [...prev];
          updatedConversation.pop(); // Remove the null entry for the system role
  
          return [
            ...updatedConversation,
            { id: Math.random() * 1000, content: simulatedResponse, role: "system" }
          ];
        });
  
        // Save the response after the simulated response
        await saveResponse(sentMsg[0].id, simulatedResponse); 
      }, 1000);
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  return (
    <div
      className={`group w-full text-gray-800 dark:text-gray-100 border-b border-black/10 dark:border-gray-900/50 ${
        isUser ? "dark:bg-gray-800" : "bg-gray-50 dark:bg-[#444654]"
      }`}
    >
      <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-xl xl:max-w-3xl flex lg:px-0 m-auto w-full">
        <div className="flex flex-row gap-4 md:gap-6 p-4 md:py-6 lg:px-2 m-auto w-full">
          <div className="w-8 flex flex-col relative items-end">
            <div className="relative h-7 w-7 p-1 rounded-sm text-white flex items-center justify-center bg-black/75">
              {isUser ? (
                <HiUser className="h-4 w-4 text-white" />
              ) : (
                <SiOpenai className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="text-xs flex items-center justify-center gap-1 absolute left-0 top-2 -ml-4 -translate-x-full group-hover:visible !invisible">
              <span className="flex-grow flex-shrink-0">1 / 1</span>
            </div>
          </div>
          <div className="relative flex w-[calc(100%-50px)] flex-col gap-1 md:gap-3 lg:w-[calc(100%-115px)]">
            <div className="flex flex-grow flex-col gap-3">
              <div className="min-h-20 flex flex-col items-start gap-4 whitespace-pre-wrap break-words">
                <div className="markdown prose w-full break-words dark:prose-invert dark">
                  {!isUser && text === null ? (
                    <TbCursorText className="h-6 w-6 animate-pulse" />
                  ) : (
                    <div>
                      {!isEditing ? (
                        <div className="flex items-start">
                          <div>
                            <p>{text}</p>
                            {isUser && (<span onClick={() => {
                              setSelectedbranchId(originalMessageId);
                              setShowModal(true)
                            }} className="text-sm text-gray-500 hover:text-gray-400 cursor-pointer">View Branches</span>)}
                          </div>
                          {role === "user" && (
                            <span
                              className="ml-2 cursor-pointer hover:bg-gray-600 p-1 rounded-full"
                              onClick={() => {
                                setEditMessage(text); // Set the current text in the edit state
                                setIsEditing(true);
                              }}
                            >
                              <FiEdit3 />
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <textarea
                            className="bg-gray-900 text-white p-2 rounded-md w-full resize-none"
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)} // Update state on change
                          />
                          <div className="space-x-3 mt-2">
                            <button
                              onClick={() => setIsEditing(false)} // Cancel edit
                              className="p-2 rounded-lg bg-gray-500 text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSave} // Save the edited message
                              className="p-2 rounded-lg bg-white text-black"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
