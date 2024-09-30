"use client"

import './globals.css';
import { useEffect, useState } from "react";
import Chat from "@/app/components/Chat";
import BranchList from "@/app/components/BranchList";
import MobileSidebar from "@/app/components/MobileSidebar";
import Sidebar from "@/app/components/Sidebar";

export default function Home() {
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedbranchId, setSelectedbranchId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const toggleModal = () => setShowModal(!showModal);
  const toggleComponentVisibility = () => {
    setIsComponentVisible(!isComponentVisible);
  };

  return (
    <main className="overflow-hidden w-full h-screen relative flex">
      {isComponentVisible ? (
        <MobileSidebar toggleComponentVisibility={toggleComponentVisibility} />
      ) : null}
      <div className="dark hidden flex-shrink-0 bg-gray-900 md:flex md:w-[260px] md:flex-col">
        <div className="flex h-full min-h-0 flex-col">
          <Sidebar 
            selectedConversationId={selectedConversationId}
            setSelectedConversationId={setSelectedConversationId} // Pass the setter function
          />
        </div>
      </div>
      <Chat toggleComponentVisibility={toggleComponentVisibility}
          selectedConversationId={selectedConversationId} 
          setSelectedConversationId={setSelectedConversationId}
          selectedbranchId={selectedbranchId}
          setSelectedbranchId={setSelectedbranchId}
          setShowModal={setShowModal}
       />
       <BranchList
        showModal={showModal} 
        setShowModal={setShowModal} 
        selectedConversationId={selectedConversationId}
        selectedbranchId={selectedbranchId}
        toggleComponentVisibility={toggleModal} 
       />
    </main>
  );
}
