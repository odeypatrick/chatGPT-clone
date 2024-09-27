import Message from "./Message";
import { useEffect, useRef, useState } from "react";
import { fetchBranchedMessages } from "../../../lib/api";
import { MessageType } from "../types/Message";

const BranchList = (props: any) => {
  const { selectedConversationId, showModal, setShowModal, selectedbranchId } = props;

  const [showEmptyChat, setShowEmptyChat] = useState(true);
  const [conversation, setConversation] = useState<MessageType[]>([]);
  const bottomOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomOfChatRef.current) {
      bottomOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  useEffect(() => {
    // Fetch messages when the selectedConversationId changes
    const fetchMessages = async () => {
      if (selectedConversationId) {
        const messages = await fetchBranchedMessages(selectedbranchId);
        const validMessages = messages.map((message: any) => ({
          id: message.id,
          content: message.content,
          role: message.role as "user" | "system",
        }));

        setConversation(validMessages);
        setShowEmptyChat(validMessages.length === 0);
      }
    };

    fetchMessages();
  }, [selectedbranchId]);

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl h-4/5">
            <div className="flex items-center justify-between border-b border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-white">Branches</h2>
              <button
                className="text-white hover:text-gray-400"
                onClick={closeModal}
              >
                X
              </button>
            </div>
            <div className="px-4 h-4/5 overflow-auto">
              <div className="relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1">
                <div className="flex-1 overflow-auto">
                  <div className="react-scroll-to-bottom--css-ikyem-79elbk h-full dark:bg-gray-800">
                    <div className="react-scroll-to-bottom--css-ikyem-1n7m0yu ">
                      {!showEmptyChat && conversation.length > 0 ? (
                        <div className="flex flex-col items-center text-sm bg-gray-800">
                          {conversation.map((msg, index) => (
                            <Message
                              key={index}
                              message={msg}
                              conversationId={selectedConversationId}
                              setConversation={setConversation}
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
                            No Branches Yet
                          </h1>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-end">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BranchList;
