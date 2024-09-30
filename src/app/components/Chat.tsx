import { useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { BsChevronDown, BsPlusLg } from "react-icons/bs";
import { RxHamburgerMenu } from "react-icons/rx";
import useAutoResizeTextArea from "@/app/hooks/useAutoResizeTextArea";
import Message from "./Message";
import { createConversation, sendMessage, saveResponse, fetchMessagesInConversation } from '../../../lib/api'; // Import the necessary API functions
import { MessageType } from "../types/Message";
import { generateAIResponse } from "../../../lib/aiResponses";

const Chat = (props: any) => {
  const { toggleComponentVisibility, 
    selectedConversationId, 
    setSelectedConversationId, 
    setShowModal,
    setSelectedbranchId 
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showEmptyChat, setShowEmptyChat] = useState(true);
  const [conversation, setConversation] = useState<MessageType[]>([]);
  const [initialConversation, setInitialConversation] = useState<MessageType[]>([]);
  const [message, setMessage] = useState("");
  const [threadLevel, setThreadLevel] = useState(0)
  const bottomOfChatRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useAutoResizeTextArea();

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "24px";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [message, textAreaRef]);

  useEffect(() => {
    if (bottomOfChatRef.current) {
      bottomOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  // Fetch messages when the selectedConversationId changes
  useEffect(() => {
    const fetchMessages = async () => {
        if (selectedConversationId) {
            const messages = await fetchMessagesInConversation(selectedConversationId);
            
            const validMessages = messages.map(message => ({
                id: message.id,
                branches: message.branches
            }));

            setConversation(validMessages);
            setInitialConversation(validMessages)
            setShowEmptyChat(validMessages.length === 0);
        }
    };

    fetchMessages();
}, [selectedConversationId]);

// useEffect(() => {
//   const filteredConversations = conversation.filter(msg => msg.branches.length == threadLevel + 1)
//   if(filteredConversations.length > 0) {
//     setConversation(filteredConversations);
//   } else {
//     setConversation(initialConversation);
//   }
// }, [threadLevel])

  const sendMessageToAPI = async (e: any) => {
    e.preventDefault();
  
    // Don't send empty messages
    if (message.length < 1) {
      setErrorMessage("Please enter a message.");
      return;
    } else {
      setErrorMessage("");
    }
  
    setIsLoading(true);
  
    // Create conversation if no selected conversation ID exists
    let conversationId = selectedConversationId;
    if (!conversationId) {
      const newConversation = await createConversation(message);
      conversationId = newConversation[0].id; // Assuming the ID is returned in this structure
    }
  
    // Send the message to the API
    const sentMsg = await sendMessage(conversationId, message);
  
    // Adjust the message type to match MessageType interface
    const userMessage: MessageType = {
      id: sentMsg[0].id, 
      content: message
    };
    
    const systemMessage: MessageType = {
      id: Math.random() * 1000, 
      content: null
    };
  
    setConversation(prev => [
      ...prev,
      {
        id: userMessage.id,
        branches: [
          {
            id: userMessage.id,
            content: userMessage.content,
            threadlevel: threadLevel,
            response: {
              id: systemMessage.id,
              content: systemMessage.content
            }
          }
        ]
      }
    ]);
  
    setMessage("");
    setShowEmptyChat(false);
    setTimeout(async () => {
      const simulatedResponse = generateAIResponse();
  
      // Add the simulated AI response to the conversation
      setConversation(prev => {
        const updatedConversation = [...prev];
        updatedConversation.pop(); // Remove the null entry for the system role
  
        return [
          ...updatedConversation,
          {
            id: userMessage.id,
            branches: [
              {
                id: userMessage.id,
                content: userMessage.content,
                threadlevel: threadLevel,
                response: {
                  id: systemMessage.id,
                  content: simulatedResponse
                }
              }
            ]
          }
        ];
      });
  
      // Save the response after the simulated response
      await saveResponse(sentMsg[0].id, simulatedResponse); 
  
      setIsLoading(false);
      setSelectedConversationId(conversationId);
    }, 1000);
  };
  

  const handleKeypress = (e: any) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      sendMessageToAPI(e);
      e.preventDefault();
    }
  };

  return (
    <div className="flex max-w-full flex-1 flex-col">
      <div className="sticky top-0 z-10 flex items-center border-b border-white/20 bg-gray-800 pl-1 pt-1 text-gray-200 sm:pl-3 md:hidden">
        <button
          type="button"
          className="-ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white dark:hover:text-white"
          onClick={toggleComponentVisibility}
        >
          <span className="sr-only">Open sidebar</span>
          <RxHamburgerMenu className="h-6 w-6 text-white" />
        </button>
        <h1 className="flex-1 text-center text-base font-normal">New chat</h1>
        <button type="button" className="px-3">
          <BsPlusLg className="h-6 w-6" />
        </button>
      </div>
      <div className="relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1">
        <div className="flex-1 overflow-hidden">
          <div className="react-scroll-to-bottom--css-ikyem-79elbk h-full dark:bg-gray-800">
            <div className="react-scroll-to-bottom--css-ikyem-1n7m0yu">
              {!showEmptyChat && conversation.length > 0 ? (
                <div className="flex flex-col items-center text-sm bg-gray-800">
                  {conversation.map((msg, index) => (
                    <Message key={index} 
                    message={msg} 
                    conversationId={selectedConversationId} 
                    setConversation={setConversation}
                    conversation={conversation}
                    threadLevel={threadLevel}
                    setThreadLevel={setThreadLevel}
                    setShowModal={setShowModal}
                    setSelectedbranchId={setSelectedbranchId}
                    />
                  ))}
                  <div className="w-full h-32 md:h-48 flex-shrink-0"></div>
                  <div ref={bottomOfChatRef}></div>
                </div>
              ) : null}
              {showEmptyChat ? (
                <div className="py-10 relative w-full flex flex-col h-full">
                  <div className="flex items-center justify-center gap-2">
                    {/* Additional empty chat UI could go here */}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-semibold text-center text-gray-200 dark:text-gray-600 flex gap-2 items-center justify-center h-screen">
                    ChatGPT Clone
                  </h1>
                </div>
              ) : null}
              <div className="flex flex-col items-center text-sm dark:bg-gray-800"></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full border-t md:border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent md:bg-vert-light-gradient bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient pt-2">
          <form className="stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl" onSubmit={sendMessageToAPI}>
            <div className="relative flex flex-col h-full flex-1 items-stretch md:flex-col">
              {errorMessage ? (
                <div className="mb-2 md:mb-0">
                  <div className="h-full flex ml-1 md:w-full md:m-auto md:mb-2 gap-0 md:gap-2 justify-center">
                    <span className="text-red-500 text-sm">{errorMessage}</span>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]">
                <textarea
                  ref={textAreaRef}
                  value={message}
                  tabIndex={0}
                  data-id="root"
                  style={{
                    height: "24px",
                    maxHeight: "200px",
                    overflowY: "hidden",
                  }}
                  placeholder="Send a message..."
                  className="m-0 w-full resize-none border-0 bg-transparent p-0 pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent pl-2 md:pl-0"
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeypress}
                ></textarea>
                <button
                  disabled={isLoading || message.length === 0}
                  type="submit"
                  className="absolute p-1 rounded-md bottom-1.5 md:bottom-2.5 bg-transparent disabled:bg-gray-500 right-1 md:right-2 disabled:opacity-40"
                >
                  <FiSend className="h-6 w-6 text-blue-600" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
