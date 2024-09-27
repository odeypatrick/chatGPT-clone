import React, { useEffect, useState } from "react";
import {
  AiOutlineMessage,
  AiOutlinePlus,
  AiOutlineUser,
  AiOutlineSetting,
} from "react-icons/ai";
import { BiLinkExternal } from "react-icons/bi";
import { FiMessageSquare } from "react-icons/fi";
import { MdLogout } from "react-icons/md";
import { fetchConversations, createConversation, clearAllConversations } from "../../../lib/api"; 

interface SidebarProps {
  selectedConversationId: string | null; 
  setSelectedConversationId: (id: string | null) => void; 
}

const Sidebar: React.FC<SidebarProps> = ({ selectedConversationId, setSelectedConversationId }) => {
  const [conversations, setConversations] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations on component mount
  useEffect(() => {
    const getConversations = async () => {
      try {
        const conversationData = await fetchConversations();
        setConversations(conversationData); 
        setLoading(false);
      } catch (error) {
        setError("Error fetching conversations");
        setLoading(false);
      }
    };

    getConversations();
  }, []);

  // Create a new conversation
  const handleCreateConversation = async () => {
    try {
      const newConversation = await createConversation("");
      setConversations((prevConversations) => [newConversation, ...prevConversations]); // Add new conversation to the top of the list
      setSelectedConversationId(newConversation[0].id);
    } catch (error) {
      setError("Error creating a new conversation");
    }
  };

  const handleClearConversation = async () => {
      try {
        await clearAllConversations();
        setConversations([]);
        setSelectedConversationId(null)
      } catch (error) {
        setError("Error clearing a new conversation");
      }
  }

  return (
    <div className="scrollbar-trigger flex h-full w-full flex-1 items-start border-white/20">
      <nav className="flex h-full flex-1 flex-col space-y-1 p-2">
        {/* New Chat button */}
        <a
          className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 flex-shrink-0 border border-white/20"
          onClick={handleCreateConversation}
        >
          <AiOutlinePlus className="h-4 w-4" />
          New chat
        </a>
        
        {/* Show loading indicator */}
        {loading ? (
          <div className="text-white">Loading conversations...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="flex-col flex-1 overflow-y-auto border-b border-white/20">
            {/* Conversations List */}
            <div className="flex flex-col gap-2 pb-2 text-gray-100 text-sm">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <a
                    key={conversation.id}
                    className={`flex py-3 px-3 items-center gap-3 relative rounded-md hover:bg-[#2A2B32] cursor-pointer break-all hover:pr-4 group ${selectedConversationId === conversation.id ? 'bg-gray-700' : ''}`}
                    onClick={() => setSelectedConversationId(conversation.id)} // Handle conversation selection
                  >
                    <FiMessageSquare className="h-4 w-4" />
                    <div className="flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative">
                      {conversation.title || "New conversation"}
                      <div className="absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-gray-900 group-hover:from-[#2A2B32]"></div>
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-white">No conversations yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Additional options */}
        <a onClick={handleClearConversation} className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm">
          <AiOutlineMessage className="h-4 w-4" />
          Clear conversations
        </a>
        <a className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm">
          <AiOutlineUser className="h-4 w-4" />
          My plan
        </a>
        <a className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm">
          <AiOutlineSetting className="h-4 w-4" />
          Settings
        </a>
        <a className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm">
          <MdLogout className="h-4 w-4" />
          Log out
        </a>
      </nav>
    </div>
  );
};

export default Sidebar;